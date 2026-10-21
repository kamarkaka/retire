import type { HistoricalRow, USSeries } from '../model/types.ts';
export const SERIES: USSeries[] = [
  'us_stocks',
  'us_bonds',
  'usd_cash',
  'us_cpi',
  'us_home',
];
export function populationMoments(values: readonly number[]) {
  if (!values.length || values.some((v) => !Number.isFinite(v)))
    throw new Error('Finite nonempty sample required');
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return {
    mean,
    sd: Math.sqrt(variance),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
export function correlation(a: readonly number[], b: readonly number[]) {
  if (a.length !== b.length) throw new Error('Sample lengths differ');
  const ma = populationMoments(a),
    mb = populationMoments(b);
  if (ma.sd === 0 || mb.sd === 0) return null;
  return (
    a.reduce((s, v, i) => s + (v - ma.mean) * (b[i] - mb.mean), 0) /
    (a.length * ma.sd * mb.sd)
  );
}
export function calibrateHistory(rows: readonly HistoricalRow[]) {
  return {
    moments: Object.fromEntries(
      SERIES.map((k) => [k, populationMoments(rows.map((r) => r[k]))]),
    ),
    correlation: SERIES.map((a) =>
      SERIES.map((b) =>
        correlation(
          rows.map((r) => r[a]),
          rows.map((r) => r[b]),
        ),
      ),
    ),
  };
}
