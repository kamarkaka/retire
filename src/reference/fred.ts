import { populationMoments, correlation } from './calibration.ts';

export interface ChinaCpiRow {
  year: number;
  cn_cpi: number;
}
export interface FxRow {
  year: number;
  date: string;
  usd_cny: number;
}
export function readFredCsv(text: string, series: string): Map<string, number> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.shift() !== `observation_date,${series}`)
    throw new Error(`Unexpected FRED header for ${series}`);
  const values = new Map<string, number>(),
    seen = new Set<string>();
  for (const line of lines) {
    const cells = line.split(','),
      date = cells[0],
      raw = cells[1];
    if (
      cells.length !== 2 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      seen.has(date)
    )
      throw new Error(`Invalid/duplicate FRED date for ${series}`);
    seen.add(date);
    if (raw === '' || raw === '.') continue;
    const value = Number(raw);
    if (!Number.isFinite(value))
      throw new Error(`Nonfinite FRED ${series}/${date}`);
    values.set(date, value);
  }
  return values;
}
export function annualUSCpi(
  values: ReadonlyMap<string, number>,
  endYear = 2025,
) {
  const december = new Map<number, number>();
  for (const [date, value] of values)
    if (date.slice(5, 7) === '12')
      december.set(Number(date.slice(0, 4)), value);
  return Array.from({ length: endYear - 1928 + 1 }, (_, i) => {
    const year = 1928 + i,
      current = december.get(year),
      previous = december.get(year - 1);
    if (
      current === undefined ||
      previous === undefined ||
      current <= 0 ||
      previous <= 0
    )
      throw new Error(`Missing/nonpositive December CPI for ${year}`);
    return { year, us_cpi: current / previous - 1 };
  });
}
export function annualChinaCpi(
  values: ReadonlyMap<string, number>,
  endYear = 2025,
): ChinaCpiRow[] {
  return Array.from({ length: endYear - 1987 + 1 }, (_, i) => {
    const year = 1987 + i,
      value = values.get(`${year}-01-01`);
    if (value === undefined) throw new Error(`Missing China CPI for ${year}`);
    return { year, cn_cpi: value / 100 };
  });
}
export function annualFx(
  values: ReadonlyMap<string, number>,
  endYear = 2025,
): FxRow[] {
  const years = new Map<number, FxRow>();
  for (const [date, value] of values) {
    const year = Number(date.slice(0, 4));
    if (year < 1981 || year > endYear) continue;
    if (value <= 0) throw new Error(`Nonpositive FX for ${date}`);
    if (!years.has(year) || date > years.get(year)!.date)
      years.set(year, { year, date, usd_cny: value });
  }
  return Array.from({ length: endYear - 1981 + 1 }, (_, i) => {
    const year = 1981 + i,
      row = years.get(year);
    if (!row) throw new Error(`Missing year-end FX for ${year}`);
    return row;
  });
}
export function calibrateChinaFx(
  china: readonly ChinaCpiRow[],
  fx: readonly FxRow[],
) {
  const cnEnd = china.at(-1)?.year ?? 0,
    fxEnd = fx.at(-1)?.year ?? 0;
  const cn = china.filter((r) => r.year >= 1997).map((r) => r.cn_cpi);
  if (cn.length !== cnEnd - 1997 + 1 || cn.length < 10)
    throw new Error('China calibration needs consecutive years from 1997');
  const x = cn.slice(0, -1),
    y = cn.slice(1),
    mx = populationMoments(x),
    my = populationMoments(y);
  const phi =
    x.reduce((n, a, i) => n + (a - mx.mean) * (y[i] - my.mean), 0) /
    (x.length * mx.sd ** 2);
  const intercept = my.mean - phi * mx.mean,
    residual = y.map((b, i) => b - intercept - phi * x[i]);
  const byYear = new Map(fx.map((r) => [r.year, r.usd_cny]));
  const logs = Array.from({ length: fxEnd - 2006 + 1 }, (_, i) => {
    const year = 2006 + i,
      current = byYear.get(year),
      previous = byYear.get(year - 1);
    if (current === undefined || previous === undefined)
      throw new Error(`Missing FX calibration pair ${year}`);
    return Math.log(current / previous);
  });
  const moments = populationMoments(logs);
  return {
    china_calibration: {
      window: [1997, cnEnd],
      observations: cn.length,
      moments: populationMoments(cn),
      lag1_correlation: correlation(x, y),
      ar1: {
        pairs: x.length,
        phi,
        intercept,
        long_run_mean: intercept / (1 - phi),
        residual_sd: populationMoments(residual).sd,
      },
    },
    fx_calibration: {
      window: [2006, fxEnd],
      observations: logs.length,
      log_return_moments: moments,
      excess_kurtosis:
        logs.reduce((n, r) => n + (r - moments.mean) ** 4, 0) /
          logs.length /
          moments.sd ** 4 -
        3,
    },
  };
}
