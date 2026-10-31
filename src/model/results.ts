import type {
  RunRequest,
  PublicReferenceBundle,
  PathSummaryBuffers,
  MarketBandSamples,
  AggregateSummary,
} from './types';
import { simulatePath } from './engine';
import {
  CHART_FIELDS,
  FLOAT_FIELDS,
  INT_FIELDS,
  FLAG_FIELDS,
  FI,
  II,
  BI,
} from './layout';
export interface ResultBuffers {
  charts: Float32Array;
  summaries: PathSummaryBuffers;
  market_samples: MarketBandSamples;
}
export type FullAggregate = AggregateSummary & {
  net_worth_usd_bands: Float32Array;
  nominal_bands: Float32Array;
  retained_bytes: number;
};
export function allocateResults(paths: number, T: number): ResultBuffers {
  return {
    charts: new Float32Array(paths * T * CHART_FIELDS.length).fill(NaN),
    summaries: {
      floats: new Float64Array(paths * FLOAT_FIELDS.length).fill(NaN),
      integers: new Int32Array(paths * INT_FIELDS.length).fill(-1),
      flags: new Uint8Array(paths * FLAG_FIELDS.length),
    },
    market_samples: {
      fx: new Float64Array(paths * (T + 1)),
      home_cpi: new Float64Array(paths * T),
      usd_cpi: new Float64Array(paths * T),
    },
  };
}
export function simulateChunk(
  request: RunRequest,
  refs: PublicReferenceBundle,
  start: number,
  end: number,
): ResultBuffers {
  const T = request.manifest.horizon,
    results = allocateResults(end - start, T);
  for (let id = start; id < end; id++) {
    const path = simulatePath(request, refs, id),
      i = id - start;
    results.charts.set(path.charts, i * T * CHART_FIELDS.length);
    results.summaries.floats.set(path.summary.floats, i * FLOAT_FIELDS.length);
    results.summaries.integers.set(
      path.summary.integers,
      i * INT_FIELDS.length,
    );
    results.summaries.flags.set(path.summary.flags, i * FLAG_FIELDS.length);
    results.market_samples.fx.set(path.market_samples.fx, i * (T + 1));
    results.market_samples.home_cpi.set(path.market_samples.home_cpi, i * T);
    results.market_samples.usd_cpi.set(path.market_samples.usd_cpi, i * T);
  }
  return results;
}
export function copyChunk(
  target: ResultBuffers,
  chunk: ResultBuffers,
  start: number,
  T: number,
) {
  target.charts.set(chunk.charts, start * T * CHART_FIELDS.length);
  target.summaries.floats.set(
    chunk.summaries.floats,
    start * FLOAT_FIELDS.length,
  );
  target.summaries.integers.set(
    chunk.summaries.integers,
    start * INT_FIELDS.length,
  );
  target.summaries.flags.set(chunk.summaries.flags, start * FLAG_FIELDS.length);
  target.market_samples.fx.set(chunk.market_samples.fx, start * (T + 1));
  target.market_samples.home_cpi.set(chunk.market_samples.home_cpi, start * T);
  target.market_samples.usd_cpi.set(chunk.market_samples.usd_cpi, start * T);
}
export function quantileSorted(
  values: ArrayLike<number>,
  q: number,
): number | null {
  if (!values.length) return null;
  const h = (values.length - 1) * q,
    lo = Math.floor(h),
    hi = Math.ceil(h);
  return values[lo] + (values[hi] - values[lo]) * (h - lo);
}
export function quantile(values: readonly number[], q: number): number | null {
  return quantileSorted(
    values.filter(Number.isFinite).sort((a, b) => a - b),
    q,
  );
}
export function quantiles(values: readonly number[]) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return {
    p10: quantileSorted(sorted, 0.1),
    p50: quantileSorted(sorted, 0.5),
    p90: quantileSorted(sorted, 0.9),
  };
}
export function rankPaths(
  paths: { id: number; depletion_t: number | null; terminal: number }[],
): number[] {
  return [...paths]
    .sort((a, b) => {
      const ad = a.depletion_t !== null,
        bd = b.depletion_t !== null;
      if (ad !== bd) return ad ? -1 : 1;
      if (ad && a.depletion_t !== b.depletion_t)
        return a.depletion_t! - b.depletion_t!;
      return a.terminal - b.terminal || a.id - b.id;
    })
    .map((p) => p.id);
}
export function retainedBytes(
  charts: Float32Array,
  summaries: PathSummaryBuffers,
) {
  return (
    charts.byteLength +
    summaries.floats.byteLength +
    summaries.integers.byteLength +
    summaries.flags.byteLength
  );
}
export function summarizeResults(
  request: RunRequest,
  charts: Float32Array,
  summaries: PathSummaryBuffers,
  markets: MarketBandSamples,
): FullAggregate {
  const N = request.manifest.n_paths,
    T = request.manifest.horizon;
  const value = (id: number, field: string) =>
      summaries.floats[id * FLOAT_FIELDS.length + FI[field]],
    integer = (id: number, field: string) =>
      summaries.integers[id * INT_FIELDS.length + II[field]],
    flag = (id: number, field: string) =>
      summaries.flags[id * FLAG_FIELDS.length + BI[field]];
  const yearly_success_probability = new Float64Array(T),
    bands = () => new Float32Array(T * 3).fill(NaN);
  const net_worth_bands = bands(),
    liquid_bands = bands(),
    net_worth_usd_bands = bands(),
    nominal_bands = bands();
  const chartIndex = Object.fromEntries(CHART_FIELDS.map((f, i) => [f, i]));
  const work = new Float64Array(N);
  const storeQuantiles = (
    target: Float32Array | Float64Array,
    offset: number,
    count: number,
  ) => {
    const active = work.subarray(0, count);
    active.sort();
    for (let i = 0; i < 3; i++)
      target[offset * 3 + i] =
        quantileSorted(active, [0.1, 0.5, 0.9][i]) ?? NaN;
  };
  for (let t = 0; t < T; t++) {
    let healthy = 0;
    for (let id = 0; id < N; id++) {
      const depletion = integer(id, 'first_depletion_t');
      if (depletion < 0 || depletion > t) healthy++;
    }
    yearly_success_probability[t] = healthy / N;
    for (const [field, target] of [
      ['net_worth_cny_real', net_worth_bands],
      ['liquid_cny_real', liquid_bands],
      ['net_worth_usd_real', net_worth_usd_bands],
      ['net_worth_cny', nominal_bands],
    ] as const) {
      let count = 0;
      for (let id = 0; id < N; id++) {
        const v =
          charts[(id * T + t) * CHART_FIELDS.length + chartIndex[field]];
        if (Number.isFinite(v)) work[count++] = v;
        else if (
          integer(id, 'active_years') >= 0 &&
          integer(id, 'active_years') <= t
        )
          work[count++] = 0;
      }
      storeQuantiles(target, t, count);
    }
  }
  const market_bands = {
    fx: new Float64Array((T + 1) * 3),
    home_cpi: new Float64Array(T * 3),
    usd_cpi: new Float64Array(T * 3),
  };
  for (const field of ['fx', 'home_cpi', 'usd_cpi'] as const) {
    const length = field === 'fx' ? T + 1 : T;
    for (let t = 0; t < length; t++) {
      for (let id = 0; id < N; id++) work[id] = markets[field][id * length + t];
      storeQuantiles(market_bands[field], t, N);
    }
  }
  const monetary_quantiles = Object.fromEntries(
    FLOAT_FIELDS.map((field) => [
      field,
      quantiles(Array.from({ length: N }, (_, id) => value(id, field))),
    ]),
  );
  const counts = (field: string) =>
      Array.from({ length: N }, (_, id) => flag(id, field)).reduce(
        (n, v) => n + v,
        0,
      ),
    depletionAges = Array.from({ length: N }, (_, id) =>
      integer(id, 'first_depletion_t'),
    )
      .filter((t) => t >= 0)
      .map((t) => request.manifest.start_age_A + t),
    hist = new Map<number, number>();
  depletionAges.forEach((a) => hist.set(a, (hist.get(a) ?? 0) + 1));
  const ranked = rankPaths(
    Array.from({ length: N }, (_, id) => ({
      id,
      depletion_t:
        integer(id, 'first_depletion_t') < 0
          ? null
          : integer(id, 'first_depletion_t'),
      terminal: value(id, 'terminal_net_worth_cny_real'),
    })),
  );
  return {
    n_paths: N,
    success_probability: 1 - counts('depleted') / N,
    forced_sale_probability: counts('forced_sale') / N,
    yearly_success_probability,
    net_worth_bands,
    liquid_bands,
    net_worth_usd_bands,
    nominal_bands,
    market_bands,
    monetary_quantiles,
    depletion_age_quantiles: {
      p10: quantile(depletionAges, 0.1),
      p50: quantile(depletionAges, 0.5),
    },
    depletion_histogram: [...hist]
      .sort((a, b) => a[0] - b[0])
      .map(([age, count]) => ({ age, count })),
    representative_paths: {
      worst: ranked[0],
      p10: ranked[Math.floor(0.1 * (N - 1))],
      median: ranked[Math.floor(0.5 * (N - 1))],
    },
    retained_bytes: retainedBytes(charts, summaries),
  };
}
export function transferBuffers(results: ResultBuffers): ArrayBuffer[] {
  return [
    results.charts.buffer,
    results.summaries.floats.buffer,
    results.summaries.integers.buffer,
    results.summaries.flags.buffer,
    results.market_samples.fx.buffer,
    results.market_samples.home_cpi.buffer,
    results.market_samples.usd_cpi.buffer,
  ] as ArrayBuffer[];
}
