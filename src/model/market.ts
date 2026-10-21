import type {
  ScenarioConfig,
  PublicReferenceBundle,
  MarketPath,
  HistoricalRow,
} from './types';
import { uniformStream, normals, bootstrapIndices } from './rng';
import { SERIES, calibrateHistory } from '../reference/calibration';
import { requireFactor, SimulationError } from './errors';

const cache = new WeakMap<
  ScenarioConfig,
  { refs: PublicReferenceBundle; rows: HistoricalRow[] }
>();
export function prepareMarket(s: ScenarioConfig, refs: PublicReferenceBundle) {
  const cached = cache.get(s);
  if (cached?.refs === refs) return cached.rows;
  const source = refs.history.filter(
    (r) => r.year >= s.market.sample_start && r.year <= s.market.sample_end,
  );
  if (source.length < 10)
    throw new SimulationError({
      code: 'REFERENCE_WINDOW',
      message: 'Reference window must contain at least 10 complete rows',
    });
  const rows = source;
  rows.forEach((r) => {
    for (const k of SERIES)
      requireFactor(1 + r[k], k === 'us_cpi' || k === 'us_home', {
        series: k,
        year: r.year,
      });
    requireFactor(1 + r.us_stocks - s.market.income_yield_us_stocks, false, {
      series: 'us_stocks price',
      year: r.year,
    });
    requireFactor(1 + r.us_bonds - s.market.income_yield_us_bonds, false, {
      series: 'us_bonds price',
      year: r.year,
    });
    if (r.usd_cash < 0)
      throw new SimulationError({
        code: 'INVALID_FACTOR',
        message: 'Cash whole return is income and must be nonnegative',
        series: 'usd_cash',
        year: r.year,
        factor: r.usd_cash,
      });
  });
  cache.set(s, { refs, rows });
  return rows;
}
export function horizon(s: ScenarioConfig) {
  return Math.max(
    ...(['A', 'B'] as const)
      .filter((id) => id === 'A' || s.people.B !== undefined)
      .map(
        (id) =>
          s.simulation.max_age -
          (s.simulation.start_year - s.people[id]!.birth_year) +
          1,
      ),
  );
}
export function buildMarket(
  s: ScenarioConfig,
  usRows: readonly HistoricalRow[],
  rowIds: Int32Array,
  cnNormals: Float64Array,
  fxNormals: Float64Array,
  pathId: number,
): MarketPath {
  const T = rowIds.length,
    m = s.market;
  const p = Object.fromEntries(
    [...SERIES, 'home_cpi']
      .map((k) => [k, new Float64Array(T)])
      .concat(
        [
          'fx',
          'home_index',
          'usd_index',
          'home_medical_index',
          'usd_medical_index',
        ].map((k) => [k, new Float64Array(T + 1)]),
      ),
  ) as unknown as MarketPath;
  p.fx[0] = m.fx_spot;
  p.home_index[0] =
    p.usd_index[0] =
    p.home_medical_index[0] =
    p.usd_medical_index[0] =
      1;
  let previous = m.home_cpi_start,
    logP = Math.log(m.fx_fair_value);
  for (let t = 0; t < T; t++) {
    const row = usRows[rowIds[t]],
      year = s.simulation.start_year + t;
    for (const k of SERIES) p[k][t] = row[k];
    const cn =
      m.home_cpi_mean +
      m.home_cpi_phi * (previous - m.home_cpi_mean) +
      m.home_cpi_sigma * cnNormals[t];
    previous = cn;
    p.home_cpi[t] = cn;
    requireFactor(1 + cn, true, { series: 'home_cpi', path_id: pathId, year });
    requireFactor(1 + row.us_cpi, true, {
      series: 'us_cpi',
      path_id: pathId,
      year,
    });
    requireFactor(1 + cn + m.medical_excess_inflation, true, {
      series: 'home_medical',
      path_id: pathId,
      year,
    });
    requireFactor(1 + row.us_cpi + m.medical_excess_inflation, true, {
      series: 'usd_medical',
      path_id: pathId,
      year,
    });
    p.home_index[t + 1] = p.home_index[t] * (1 + cn);
    p.usd_index[t + 1] = p.usd_index[t] * (1 + row.us_cpi);
    p.home_medical_index[t + 1] =
      p.home_medical_index[t] * (1 + cn + m.medical_excess_inflation);
    p.usd_medical_index[t + 1] =
      p.usd_medical_index[t] * (1 + row.us_cpi + m.medical_excess_inflation);
    logP += Math.log1p(cn) - Math.log1p(row.us_cpi) + m.fx_real_trend;
    const logS = Math.log(p.fx[t]);
    p.fx[t + 1] = Math.exp(
      logS +
        (m.fx_mode === 'drift'
          ? m.fx_drift
          : m.fx_adjust_speed * (logP - logS)) +
        m.fx_sigma * fxNormals[t],
    );
    for (const k of [
      'fx',
      'home_index',
      'usd_index',
      'home_medical_index',
      'usd_medical_index',
    ] as const)
      requireFactor(p[k][t + 1], true, { series: k, path_id: pathId, year });
  }
  return p;
}
export function generateMarketPath(
  s: ScenarioConfig,
  refs: PublicReferenceBundle,
  pathId: number,
): MarketPath {
  const rows = prepareMarket(s, refs),
    T = horizon(s),
    seed = s.simulation.seed;
  return buildMarket(
    s,
    rows,
    bootstrapIndices(
      T,
      rows.length,
      s.market.block_mean_years,
      uniformStream(seed, pathId, 'bootstrap'),
    ),
    normals(uniformStream(seed, pathId, 'cn_cpi'), T),
    normals(uniformStream(seed, pathId, 'fx'), T),
    pathId,
  );
}
export function marketPreview(s: ScenarioConfig, refs: PublicReferenceBundle) {
  const rows = prepareMarket(s, refs);
  return {
    window: [rows[0].year, rows.at(-1)!.year],
    calibration: calibrateHistory(rows),
    label: refs.versions.history.startsWith('synthetic')
      ? 'Synthetic demonstration reference'
      : 'Imported historical reference',
    return_convention:
      'Arithmetic annual means. At positive volatility these are not compound returns.',
  };
}
