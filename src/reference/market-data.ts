import { z } from 'zod';
import { hashObject, freezePlain } from '../model/canonical.ts';
import { calibrateHistory } from './calibration.ts';
import { translate } from '../i18n/core.ts';
import type { DraftScenario, PublicReferenceBundle } from '../model/types.ts';

export const MARKET_DATA_FORMAT = 'retire-market-data-v1' as const;
export const MAX_MARKET_DATA_BYTES = 4 * 1024 * 1024;
export const PUBLIC_MARKET_SOURCES = {
  NYU: 'https://pages.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls',
  CPIAUCNS: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCNS',
  FPCPITOTLZGCHN:
    'https://fred.stlouisfed.org/graph/fredgraph.csv?id=FPCPITOTLZGCHN',
  DEXCHUS: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DEXCHUS',
  DGS10: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10',
} as const;
const finite = z.number().finite(),
  year = z.number().int().min(1900).max(2199);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timestamp = z.string().datetime();
const sourceId = z.enum([
  'NYU',
  'CPIAUCNS',
  'FPCPITOTLZGCHN',
  'DEXCHUS',
  'DGS10',
]);
const observation = z.strictObject({
  value: finite,
  date,
  source_id: sourceId,
  definition: z.string().min(1).max(500),
});
const income = observation.extend({
  value: finite.min(0).max(1),
  numerator: finite.optional(),
  denominator: finite.positive().optional(),
});
const schema = z.strictObject({
  format_version: z.literal(MARKET_DATA_FORMAT),
  fetched_at: timestamp,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  history: z
    .array(
      z.strictObject({
        year,
        us_stocks: finite.min(-1),
        us_bonds: finite.min(-1),
        usd_cash: finite.min(0),
        us_cpi: finite.gt(-1),
        us_home: finite.gt(-1),
      }),
    )
    .min(10)
    .max(272),
  china_cpi: z
    .array(z.strictObject({ year, cn_cpi: finite.gt(-1) }))
    .min(10)
    .max(272),
  usd_cny: z
    .array(z.strictObject({ year, date, usd_cny: finite.positive() }))
    .min(10)
    .max(272),
  income_yields: z.strictObject({ us_stocks: income, us_bonds: income }),
  latest: z.strictObject({
    usd_cny: observation,
    cn_cpi: observation,
    us_cpi: observation,
  }),
  sources: z
    .array(
      z.strictObject({
        id: sourceId,
        url: z.string().url(),
        retrieved_at: timestamp,
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        bytes: z
          .number()
          .int()
          .positive()
          .max(20 * 1024 * 1024),
      }),
    )
    .length(5),
});
export type MarketDataSnapshot = z.infer<typeof schema>;
export function marketDataHash(data: MarketDataSnapshot): string {
  return hashObject({
    format_version: data.format_version,
    history: data.history,
    china_cpi: data.china_cpi,
    usd_cny: data.usd_cny,
    income_yields: data.income_yields,
    latest: data.latest,
    sources: data.sources.map(({ id, url, sha256, bytes }) => ({
      id,
      url,
      sha256,
      bytes,
    })),
  });
}
export function validateMarketData(
  input: unknown,
): Readonly<MarketDataSnapshot> {
  const data = schema.parse(input);
  const consecutive = (rows: readonly { year: number }[], start: number) => {
    if (rows[0].year !== start || rows.some((r, i) => r.year !== start + i))
      throw new Error(`Market data has missing/duplicate years from ${start}`);
  };
  consecutive(data.history, 1928);
  consecutive(data.china_cpi, 1987);
  consecutive(data.usd_cny, 1981);
  const end = data.history.at(-1)!.year;
  if (data.china_cpi.at(-1)!.year > end || data.usd_cny.at(-1)!.year > end)
    throw new Error('Calibration rows extend beyond the complete US history');
  const ids = new Set(data.sources.map((s) => s.id));
  if (
    ids.size !== 5 ||
    data.sources.some((s) => s.url !== PUBLIC_MARKET_SOURCES[s.id])
  )
    throw new Error(
      'Market data source URLs do not match the public source list',
    );
  if (data.sources.some((s) => s.retrieved_at > data.fetched_at))
    throw new Error('Source retrieval is later than the snapshot');
  const observations = [
    ...Object.values(data.income_yields),
    ...Object.values(data.latest),
  ];
  if (observations.some((o) => o.date > data.fetched_at.slice(0, 10)))
    throw new Error('Market data contains a future observation');
  if (
    data.income_yields.us_stocks.source_id !== 'NYU' ||
    data.income_yields.us_bonds.source_id !== 'DGS10' ||
    data.latest.usd_cny.source_id !== 'DEXCHUS' ||
    data.latest.cn_cpi.source_id !== 'FPCPITOTLZGCHN' ||
    data.latest.us_cpi.source_id !== 'CPIAUCNS'
  )
    throw new Error('Market data observation has the wrong source');
  const stock = data.income_yields.us_stocks;
  if (
    stock.numerator === undefined ||
    stock.denominator === undefined ||
    Math.abs(stock.value - stock.numerator / stock.denominator) > 1e-12
  )
    throw new Error(
      'Stock dividend yield does not match its source components',
    );
  if (stock.date !== `${end}-12-31`)
    throw new Error(
      'Stock income yield must match the latest complete return year',
    );
  if (
    data.latest.usd_cny.value <= 0 ||
    data.latest.cn_cpi.value <= -1 ||
    data.latest.us_cpi.value <= -1
  )
    throw new Error('Invalid latest FX/inflation observation');
  if (data.usd_cny.some((r) => Number(r.date.slice(0, 4)) !== r.year))
    throw new Error('Year-end FX date has the wrong year');
  if (marketDataHash(data) !== data.sha256)
    throw new Error('Market data SHA-256 does not match its contents');
  return freezePlain(data);
}
export function parseMarketData(text: string): Readonly<MarketDataSnapshot> {
  if (new TextEncoder().encode(text).byteLength > MAX_MARKET_DATA_BYTES)
    throw new Error('Market data package exceeds 4 MiB');
  return validateMarketData(JSON.parse(text));
}
export function withMarketData(
  base: PublicReferenceBundle,
  data: Readonly<MarketDataSnapshot>,
): PublicReferenceBundle {
  return freezePlain({
    ...base,
    history: data.history,
    market_data: data,
    versions: {
      ...base.versions,
      history: `nyu-fred-1928-${data.history.at(-1)!.year}-v1`,
      market_data: MARKET_DATA_FORMAT,
    },
    hashes: {
      ...base.hashes,
      history: hashObject(data.history),
      calibration: hashObject(calibrateHistory(data.history)),
      market_data: data.sha256,
    },
  });
}
export function marketDataLabel(
  refs: PublicReferenceBundle,
  lang = 'en',
): string {
  return translate(lang, 'marketData.label', {
    start: refs.history[0].year,
    end: refs.history.at(-1)!.year,
  });
}
/** Apply only source-backed inputs. Preserve budgets, allocations and user-selected risk assumptions. */
export function applyMarketData(
  draft: DraftScenario,
  data: Readonly<MarketDataSnapshot>,
  previous: PublicReferenceBundle,
): DraftScenario {
  const oldEnd = previous.history.at(-1)!.year,
    newEnd = data.history.at(-1)!.year;
  return {
    ...draft,
    market: {
      ...draft.market,
      ...(draft.market?.sample_end === oldEnd && newEnd > oldEnd
        ? { sample_end: newEnd }
        : {}),
      income_yield_us_stocks: data.income_yields.us_stocks.value,
      income_yield_us_bonds: data.income_yields.us_bonds.value,
      fx_spot: data.latest.usd_cny.value,
    },
  };
}
