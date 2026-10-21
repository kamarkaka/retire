import type { Page } from '@playwright/test';

export interface WorkerEvidence {
  live: number;
  max_live: number;
  created: number;
  terminated: number;
  stale_deliveries: number;
  native_chunks: number;
  delivered_chunks: number[];
  held_chunks: number;
  transfers: { type: string; before: number[]; after: number[] }[];
  summaries: {
    run_id: string;
    n_paths: number;
    seed: number;
    hashes?: Record<string, string>;
    floats?: number[];
    bytes: number;
  }[];
  replays: { path_id: number; hash?: string }[];
  failures: unknown[];
}
declare global {
  interface Window {
    __workerEvidence: WorkerEvidence;
    __releaseHeldWorkerChunks: () => number;
  }
}

// Observe the native Worker boundary from the test; no product test endpoint or hook.
export async function observeWorkers(
  page: Page,
  options: {
    hashes?: boolean;
    floats?: boolean;
    delay?: number;
    summaryDelay?: number;
    hardware?: number;
    prefix?: number;
    holdChunks?: boolean;
  } = {},
) {
  await page.addInitScript((options) => {
    const Native = window.Worker,
      evidence: WorkerEvidence = {
        live: 0,
        max_live: 0,
        created: 0,
        terminated: 0,
        stale_deliveries: 0,
        native_chunks: 0,
        delivered_chunks: [],
        held_chunks: 0,
        transfers: [],
        summaries: [],
        replays: [],
        failures: [],
      };
    window.__workerEvidence = evidence;
    let holdingChunks = !!options.holdChunks;
    const heldChunks: (() => void)[] = [];
    window.__releaseHeldWorkerChunks = () => {
      holdingChunks = false;
      const deliveries = heldChunks.splice(0);
      evidence.held_chunks = 0;
      deliveries.forEach((deliver) => deliver());
      return deliveries.length;
    };
    if (options.hardware)
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        configurable: true,
        get: () => options.hardware,
      });
    const digest = async (buffer: ArrayBuffer) =>
      Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)),
        (b) => b.toString(16).padStart(2, '0'),
      ).join('');
    class Observed extends Native {
      private stopped = false;
      private metadata: { n_paths: number; seed: number } = {
        n_paths: 0,
        seed: 0,
      };
      constructor(url: string | URL, workerOptions?: WorkerOptions) {
        super(url, workerOptions);
        evidence.created++;
        evidence.live++;
        evidence.max_live = Math.max(evidence.max_live, evidence.live);
        const descriptor = Object.getOwnPropertyDescriptor(
          Native.prototype,
          'onmessage',
        )!;
        Object.defineProperty(this, 'onmessage', {
          configurable: true,
          get: () => descriptor.get!.call(this),
          set: (handler: Worker['onmessage']) =>
            descriptor.set!.call(this, (event: MessageEvent) => {
              const deliver = () => {
                if (this.stopped) evidence.stale_deliveries++;
                if (event.data?.type === 'chunk')
                  evidence.delivered_chunks.push(event.data.start_path);
                handler?.call(this, event);
              };
              if (event.data?.type === 'chunk' && holdingChunks) {
                heldChunks.push(deliver);
                evidence.held_chunks = heldChunks.length;
              } else if (event.data?.type === 'summary' && options.summaryDelay)
                window.setTimeout(deliver, options.summaryDelay);
              else if (event.data?.type === 'chunk' && options.delay)
                window.setTimeout(
                  deliver,
                  event.data.start_path === 0
                    ? options.delay
                    : Math.min(20, options.delay),
                );
              else deliver();
            }),
        });
        this.addEventListener('message', (event) => {
          const m = event.data;
          if (m.type === 'chunk') evidence.native_chunks++;
          if (m.type === 'failed') evidence.failures.push(m.error);
          if (m.type === 'summary') {
            const arrays = {
              charts: m.charts,
              floats: m.summaries.floats,
              integers: m.summaries.integers,
              flags: m.summaries.flags,
            };
            const item: WorkerEvidence['summaries'][number] = {
              run_id: m.run_id,
              ...this.metadata,
              bytes: Object.values(arrays).reduce(
                (n, a) => n + a.byteLength,
                0,
              ),
            };
            if (options.floats) item.floats = Array.from(m.summaries.floats);
            evidence.summaries.push(item);
            if (options.hashes)
              void Promise.all(
                Object.entries(arrays).map(async ([key, array]) => {
                  const bytes = options.prefix
                    ? Math.min(
                        array.byteLength,
                        (array.byteLength / this.metadata.n_paths) *
                          options.prefix,
                      )
                    : array.byteLength;
                  return [key, await digest(array.buffer.slice(0, bytes))];
                }),
              ).then((entries) => {
                item.hashes = Object.fromEntries(entries);
              });
          }
          if (m.type === 'replay') {
            const item: WorkerEvidence['replays'][number] = {
              path_id: m.path_id ?? m.result.path_id,
            };
            evidence.replays.push(item);
            if (options.hashes)
              void digest(m.result.ledger.buffer).then((hash) => {
                item.hash = hash;
              });
          }
        });
      }
      override postMessage(
        message: unknown,
        optionsOrTransfer?: Transferable[] | StructuredSerializeOptions,
      ) {
        const m = message as {
          type: string;
          request?: { manifest: { n_paths: number; seed: number } };
        };
        if (m.request)
          this.metadata = {
            n_paths: m.request.manifest.n_paths,
            seed: m.request.manifest.seed,
          };
        const transfers = Array.isArray(optionsOrTransfer)
          ? optionsOrTransfer
          : (optionsOrTransfer?.transfer ?? []);
        const buffers = transfers.filter(
            (v): v is ArrayBuffer => v instanceof ArrayBuffer,
          ),
          before = buffers.map((b) => b.byteLength);
        if (Array.isArray(optionsOrTransfer))
          super.postMessage(message, optionsOrTransfer);
        else super.postMessage(message, optionsOrTransfer);
        if (buffers.length)
          evidence.transfers.push({
            type: m.type,
            before,
            after: buffers.map((b) => b.byteLength),
          });
      }
      override terminate() {
        if (!this.stopped) {
          this.stopped = true;
          evidence.live--;
          evidence.terminated++;
        }
        super.terminate();
      }
    }
    window.Worker = Observed;
  }, options);
}
export async function workerEvidence(page: Page) {
  return page.evaluate(() => window.__workerEvidence);
}
