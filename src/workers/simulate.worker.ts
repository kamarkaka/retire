/// <reference lib="webworker" />
import type {
  RunRequest,
  PublicReferenceBundle,
  WorkerRequest,
  WorkerResponse,
} from '../model/types';
import { simulateChunk, transferBuffers } from '../model/results';
import { replayPathLedger } from '../model/engine';
import { prepareMarket } from '../model/market';
import { SimulationError } from '../model/errors';
import { freezePlain } from '../model/canonical';
let request: RunRequest | undefined,
  refs: PublicReferenceBundle | undefined,
  runId = '';
const send = (message: WorkerResponse, transfer: Transferable[] = []) =>
  self.postMessage(message, { transfer });
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  try {
    if (message.type === 'initialize') {
      request = freezePlain(message.request);
      refs = freezePlain(message.references);
      runId = message.run_id;
      prepareMarket(request.scenario, refs);
      send({ type: 'initialized', run_id: runId });
    } else if (
      message.type === 'simulate_chunk' &&
      message.run_id === runId &&
      request &&
      refs
    ) {
      const result = simulateChunk(
        request,
        refs,
        message.start_path,
        message.end_path_exclusive,
      );
      send(
        {
          type: 'chunk',
          run_id: runId,
          start_path: message.start_path,
          end_path_exclusive: message.end_path_exclusive,
          charts: result.charts,
          summaries: result.summaries,
          market_samples: result.market_samples,
        },
        transferBuffers(result),
      );
    } else if (message.type === 'replay') {
      const result = replayPathLedger(
        freezePlain(message.request),
        freezePlain(message.references),
        message.path_id,
      );
      const arrays = [
        result.ledger,
        ...Object.values(result.market),
      ] as ArrayBufferView[];
      send(
        { type: 'replay', run_id: message.run_id, result },
        arrays.map((a) => a.buffer) as ArrayBuffer[],
      );
    }
  } catch (error) {
    send({
      type: 'failed',
      run_id: message.run_id,
      error:
        error instanceof SimulationError
          ? error.detail
          : {
              code: 'WORKER_ERROR',
              message: error instanceof Error ? error.message : String(error),
            },
    });
  }
};
