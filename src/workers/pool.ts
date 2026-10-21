import SimulationWorker from './simulate.worker?worker&inline';
import AnalysisWorker from './analysis.worker?worker&inline';
import type {
  RunRequest,
  PublicReferenceBundle,
  ExecutionMetadata,
  WorkerResponse,
  PathSummaryBuffers,
} from '../model/types';
import {
  allocateResults,
  copyChunk,
  transferBuffers,
  retainedBytes,
  type ResultBuffers,
  type FullAggregate,
} from '../model/results';
import {
  CHART_FIELDS,
  FLOAT_FIELDS,
  INT_FIELDS,
  FLAG_FIELDS,
} from '../model/layout';
import { SimulationError } from '../model/errors';
import type { DetailedReplay } from '../model/engine';
import type { PairedComparison } from '../model/comparison';
export const EXECUTION_BUDGET = 512 * 1024 * 1024;
export interface CompletedRun {
  request: RunRequest;
  references: PublicReferenceBundle;
  execution: ExecutionMetadata;
  charts: Float32Array;
  summaries: PathSummaryBuffers;
  aggregate: FullAggregate;
}
export class CanceledRun extends Error {
  constructor() {
    super('Run canceled');
  }
}
export function estimateMemory(
  request: RunRequest,
  pinnedBytes = 0,
  workers = 4,
  chunk = 64,
) {
  const N = request.manifest.n_paths,
    T = request.manifest.horizon,
    perPath =
      T * CHART_FIELDS.length * 4 +
      FLOAT_FIELDS.length * 8 +
      INT_FIELDS.length * 4 +
      FLAG_FIELDS.length,
    marketBytes = (3 * T + 1) * 8;
  const retained = N * perPath,
    temporary = N * marketBytes,
    workspace = workers * chunk * (perPath + marketBytes),
    reserve = 96 * 1024 * 1024,
    analysisScratch = N * 16;
  return {
    retained_bytes: retained,
    temporary_market_bytes: temporary,
    workspace_bytes: workspace,
    pinned_bytes: pinnedBytes,
    reserve_bytes: reserve,
    modeled_allocation_bytes:
      retained +
      temporary +
      workspace +
      pinnedBytes +
      reserve +
      analysisScratch,
  };
}
export function startRun(
  request: RunRequest,
  refs: PublicReferenceBundle,
  onProgress: (phase: 'running' | 'summarizing', completed: number) => void,
  pinnedBytes = 0,
  options: { workers?: number; chunk?: number } = {},
) {
  const N = request.manifest.n_paths,
    T = request.manifest.horizon,
    workerCount = Math.min(
      N,
      4,
      options.workers ?? Math.max(1, (navigator.hardwareConcurrency || 2) - 1),
    ),
    chunk = options.chunk ?? 64;
  if (
    !Number.isSafeInteger(workerCount) ||
    workerCount < 1 ||
    !Number.isSafeInteger(chunk) ||
    chunk < 1
  )
    throw new Error(
      'Worker count and chunk size must be positive safe integers',
    );
  const estimate = estimateMemory(request, pinnedBytes, workerCount, chunk);
  if (estimate.modeled_allocation_bytes > EXECUTION_BUDGET)
    throw new SimulationError({
      code: 'RESOURCE_BUDGET',
      message: `Requested ${N.toLocaleString()} paths need ${(estimate.modeled_allocation_bytes / 1048576).toFixed(1)} MiB of modeled allocations, above the 512 MiB allocation budget. Full browser memory can be higher. Requested count is unchanged.`,
    });
  const runId = crypto.randomUUID(),
    started = performance.now(),
    execution: ExecutionMetadata = {
      run_id: runId,
      browser: navigator.userAgent,
      os: navigator.platform,
      hardware_concurrency: navigator.hardwareConcurrency,
      worker_count: workerCount,
      chunk_size: chunk,
      started_at: new Date().toISOString(),
      memory_estimate_bytes: estimate.modeled_allocation_bytes,
      memory_estimate_scope:
        'Known simulation buffers, worker workspaces, pinned results, scratch and 96 MiB reserve; excludes browser overhead and JavaScript heaps. This is not an OS process memory cap.',
    };
  let result: ResultBuffers | undefined = allocateResults(N, T),
    completed = 0,
    next = 0,
    settled = false,
    rejectRun: (e: unknown) => void = () => {},
    resolveRun: (r: CompletedRun) => void = () => {},
    analysis: Worker | undefined;
  const workers: Worker[] = [],
    assigned = new Map<Worker, { start: number; end: number }>();
  const dispose = () => {
    workers.forEach((w) => w.terminate());
    analysis?.terminate();
  };
  const fail = (error: unknown) => {
    if (settled) return;
    settled = true;
    dispose();
    result = undefined;
    rejectRun(error);
  };
  const promise = new Promise<CompletedRun>((resolve, reject) => {
    resolveRun = resolve;
    rejectRun = reject;
  });
  const assign = (worker: Worker) => {
    if (next >= N) return;
    const range = { start: next, end: Math.min(N, next + chunk) };
    next = range.end;
    assigned.set(worker, range);
    worker.postMessage({
      type: 'simulate_chunk',
      run_id: runId,
      start_path: range.start,
      end_path_exclusive: range.end,
    });
  };
  const summarize = () => {
    try {
      workers.forEach((w) => w.terminate());
      onProgress('summarizing', N);
      analysis = new AnalysisWorker();
      analysis.onerror = () =>
        fail(new Error('Analysis worker could not load'));
      analysis.onmessage = (
        e: MessageEvent<
          WorkerResponse & {
            charts: Float32Array;
            summaries: PathSummaryBuffers;
          }
        >,
      ) => {
        if (settled || e.data.run_id !== runId) return;
        if (e.data.type === 'failed') {
          fail(new SimulationError(e.data.error));
          return;
        }
        if (e.data.type === 'summary') {
          settled = true;
          dispose();
          execution.finished_at = new Date().toISOString();
          execution.elapsed_ms = performance.now() - started;
          result = undefined;
          resolveRun({
            request,
            references: refs,
            execution,
            charts: e.data.charts,
            summaries: e.data.summaries,
            aggregate: e.data.result as FullAggregate,
          });
        }
      };
      analysis.postMessage(
        {
          type: 'summarize',
          run_id: runId,
          request,
          charts: result!.charts,
          summaries: result!.summaries,
          market_samples: result!.market_samples,
        },
        transferBuffers(result!),
      );
    } catch (error) {
      fail(error);
    }
  };
  try {
    for (let i = 0; i < workerCount; i++) {
      const worker = new SimulationWorker();
      workers.push(worker);
      worker.onerror = () =>
        fail(new Error('Simulation worker could not load'));
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const message = e.data;
        if (settled || message.run_id !== runId) return;
        if (message.type === 'failed') {
          fail(new SimulationError(message.error));
          return;
        }
        if (message.type === 'initialized') {
          assign(worker);
          return;
        }
        if (message.type === 'chunk') {
          const range = assigned.get(worker),
            paths = message.end_path_exclusive - message.start_path;
          if (
            !range ||
            range.start !== message.start_path ||
            range.end !== message.end_path_exclusive ||
            message.charts.length !== paths * T * CHART_FIELDS.length ||
            message.summaries.floats.length !== paths * FLOAT_FIELDS.length ||
            message.summaries.integers.length !== paths * INT_FIELDS.length ||
            message.summaries.flags.length !== paths * FLAG_FIELDS.length ||
            message.market_samples.fx.length !== paths * (T + 1) ||
            message.market_samples.home_cpi.length !== paths * T ||
            message.market_samples.usd_cpi.length !== paths * T
          ) {
            fail(new Error('Worker range/buffer contract mismatch'));
            return;
          }
          assigned.delete(worker);
          copyChunk(
            result!,
            {
              charts: message.charts,
              summaries: message.summaries,
              market_samples: message.market_samples,
            },
            message.start_path,
            T,
          );
          completed += paths;
          onProgress('running', completed);
          if (completed === N) summarize();
          else assign(worker);
        }
      };
      worker.postMessage({
        type: 'initialize',
        run_id: runId,
        request,
        references: refs,
      });
    }
  } catch (error) {
    fail(error);
  }
  return { id: runId, promise, cancel: () => fail(new CanceledRun()) };
}
export function startReplay(
  run: CompletedRun,
  refs: PublicReferenceBundle,
  pathId: number,
) {
  if (
    !Number.isSafeInteger(pathId) ||
    pathId < 0 ||
    pathId >= run.request.manifest.n_paths
  )
    throw new Error('Path ID is outside this run');
  const worker = new SimulationWorker(),
    id = crypto.randomUUID();
  let settled = false,
    rejectReplay: (error: unknown) => void = () => {};
  const fail = (error: unknown) => {
    if (settled) return;
    settled = true;
    worker.terminate();
    rejectReplay(error);
  };
  const promise = new Promise<DetailedReplay>((resolve, reject) => {
    rejectReplay = reject;
    worker.onerror = () => fail(new Error('Replay worker failed'));
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (settled || e.data.run_id !== id) return;
      if (e.data.type === 'failed') fail(new SimulationError(e.data.error));
      else if (e.data.type === 'replay') {
        settled = true;
        worker.terminate();
        resolve(e.data.result as DetailedReplay);
      }
    };
    try {
      worker.postMessage({
        type: 'replay',
        run_id: id,
        path_id: pathId,
        request: run.request,
        references: refs,
      });
    } catch (error) {
      fail(error);
    }
  });
  return { id, promise, cancel: () => fail(new CanceledRun()) };
}
export function startComparison(baseline: CompletedRun, current: CompletedRun) {
  if (!pairedRuns(baseline, current))
    throw new Error('Per-path differences require compatible indexed runs');
  const id = crypto.randomUUID(),
    worker = new AnalysisWorker();
  let settled = false,
    rejectComparison: (error: unknown) => void = () => {};
  const fail = (error: unknown) => {
    if (settled) return;
    settled = true;
    worker.terminate();
    rejectComparison(error);
  };
  const promise = new Promise<PairedComparison>((resolve, reject) => {
    rejectComparison = reject;
    worker.onerror = () => fail(new Error('Comparison worker failed'));
    worker.onmessage = (
      e: MessageEvent<{
        type: string;
        run_id: string;
        result: PairedComparison;
        error: { code: string; message: string };
      }>,
    ) => {
      if (settled || e.data.run_id !== id) return;
      if (e.data.type === 'failed') fail(new SimulationError(e.data.error));
      else if (e.data.type === 'comparison') {
        settled = true;
        worker.terminate();
        resolve(e.data.result);
      }
    };
    // Copy only the two scalar summaries. The completed and pinned runs keep ownership.
    const a = baseline.summaries.floats.slice(),
      b = current.summaries.floats.slice();
    try {
      worker.postMessage(
        {
          type: 'compare',
          run_id: id,
          baseline: a,
          current: b,
          n_paths: current.request.manifest.n_paths,
        },
        [a.buffer, b.buffer],
      );
    } catch (error) {
      fail(error);
    }
  });
  return { id, promise, cancel: () => fail(new CanceledRun()) };
}
export function completedBytes(run: CompletedRun) {
  return retainedBytes(run.charts, run.summaries);
}
export function pairedRuns(a: CompletedRun, b: CompletedRun) {
  const x = a.request.manifest,
    y = b.request.manifest;
  return (
    x.seed === y.seed &&
    x.n_paths === y.n_paths &&
    x.start_year === y.start_year &&
    x.horizon === y.horizon &&
    x.start_age_A === y.start_age_A &&
    x.start_age_B === y.start_age_B &&
    JSON.stringify(x.property_stream_ids) ===
      JSON.stringify(y.property_stream_ids) &&
    JSON.stringify(x.reference_hashes) === JSON.stringify(y.reference_hashes) &&
    x.model_version === y.model_version &&
    x.rng_version === y.rng_version &&
    x.draw_version === y.draw_version &&
    x.build_version === y.build_version &&
    x.result_layout_version === y.result_layout_version
  );
}
