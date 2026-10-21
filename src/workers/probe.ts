export async function probeWorker(): Promise<{
  detached: boolean;
  values: number[];
}> {
  const worker = new Worker(new URL('./probe.worker.ts', import.meta.url), {
    type: 'module',
  });
  const values = new Float64Array([1, 2, 3]);
  const run_id = 'probe-v1';
  let detached = false;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('Worker probe timed out'));
    }, 5000);
    worker.onerror = () => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error('Worker load failed'));
    };
    worker.onmessage = (e) => {
      if (e.data.run_id !== run_id) return;
      clearTimeout(timer);
      worker.terminate();
      resolve({ detached, values: Array.from(e.data.values as Float64Array) });
    };
    worker.postMessage({ run_id, values }, [values.buffer]);
    detached = values.byteLength === 0;
  });
}
