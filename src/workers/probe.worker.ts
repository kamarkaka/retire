/// <reference lib="webworker" />
self.onmessage = (
  event: MessageEvent<{ run_id: string; values: Float64Array }>,
) => {
  const { run_id, values } = event.data;
  self.postMessage({ run_id, values }, { transfer: [values.buffer] });
};
