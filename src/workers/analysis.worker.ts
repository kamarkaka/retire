/// <reference lib="webworker" />
import type { WorkerRequest } from '../model/types';
import { summarizeResults } from '../model/results';
import { comparePairedSummaries } from '../model/comparison';
type CompareRequest = {
  type: 'compare';
  run_id: string;
  baseline: Float64Array;
  current: Float64Array;
  n_paths: number;
};
self.onmessage = (event: MessageEvent<WorkerRequest | CompareRequest>) => {
  const message = event.data;
  if (message.type !== 'summarize' && message.type !== 'compare') return;
  try {
    if (message.type === 'compare') {
      const result = comparePairedSummaries(
        message.baseline,
        message.current,
        message.n_paths,
      );
      self.postMessage({ type: 'comparison', run_id: message.run_id, result });
      return;
    }
    const result = summarizeResults(
      message.request,
      message.charts,
      message.summaries,
      message.market_samples,
    );
    const buffers = [
      message.charts.buffer,
      ...Object.values(message.summaries).map((a) => a.buffer),
      ...Object.values(result)
        .filter((v) => ArrayBuffer.isView(v))
        .map((v) => (v as ArrayBufferView).buffer),
      ...Object.values(result.market_bands).map((a) => a.buffer),
    ];
    self.postMessage(
      {
        type: 'summary',
        run_id: message.run_id,
        result,
        charts: message.charts,
        summaries: message.summaries,
      },
      { transfer: [...new Set(buffers)] as ArrayBuffer[] },
    );
  } catch (error) {
    self.postMessage({
      type: 'failed',
      run_id: message.run_id,
      error: {
        code: 'ANALYSIS_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
};
