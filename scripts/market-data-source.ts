/** Public financial data only. No scenario, account, or server-side config inputs. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import * as XLSX from 'xlsx';
import {
  readFredCsv,
  annualUSCpi,
  annualChinaCpi,
  annualFx,
} from '../src/reference/fred.ts';
import {
  PUBLIC_MARKET_SOURCES,
  MARKET_DATA_FORMAT,
  marketDataHash,
  validateMarketData,
  type MarketDataSnapshot,
} from '../src/reference/market-data.ts';
import type { HistoricalRow } from '../src/model/types.ts';

export type PublicSourceId = keyof typeof PUBLIC_MARKET_SOURCES;
export type PublicSourceBytes = Record<PublicSourceId, Uint8Array>;
const exec = promisify(execFile);
export async function fetchPublicSource(
  id: PublicSourceId,
): Promise<Uint8Array> {
  // curl uses the host's normal network/proxy configuration; URLs are fixed, never user supplied.
  const { stdout } = await exec(
    'curl',
    [
      '--proto',
      '=https',
      '--proto-redir',
      '=https',
      '--location',
      '--fail',
      '--silent',
      '--show-error',
      '--connect-timeout',
      '10',
      '--max-time',
      '25',
      PUBLIC_MARKET_SOURCES[id],
    ],
    { encoding: 'buffer', maxBuffer: 20 * 1024 * 1024, timeout: 28000 },
  );
  if (!stdout.length) throw new Error(`Empty public source ${id}`);
  return new Uint8Array(stdout);
}
function latest(
  values: ReadonlyMap<string, number>,
  id: string,
): [string, number] {
  const row = Array.from(values)
    .sort(([a], [b]) => a.localeCompare(b))
    .at(-1);
  if (!row) throw new Error(`No observations for ${id}`);
  return row;
}
function workbookRows(book: XLSX.WorkBook, name: string): unknown[][] {
  const sheet = book.Sheets[name];
  if (!sheet) throw new Error(`NYU sheet missing: ${name}`);
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });
}
function numeric(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error(`Non-numeric NYU ${label}`);
  return value;
}
export function parsePublicMarketSources(
  raw: PublicSourceBytes,
  fetchedAt = new Date().toISOString(),
): Readonly<MarketDataSnapshot> {
  const book = XLSX.read(raw.NYU, { type: 'array' }),
    returns = workbookRows(book, 'Returns by year');
  const header = returns.findIndex(
    (row) => row[0] === 'Year' && row[1] === 'S&P 500 (includes dividends)',
  );
  if (
    header < 0 ||
    returns[header][3] !== '3-month T.Bill' ||
    returns[header][4] !== 'US T. Bond (10-year)' ||
    returns[header][6] !== 'Real Estate'
  )
    throw new Error('NYU return headers changed');
  const lastCompleteYear = Number(fetchedAt.slice(0, 4)) - 1;
  const nyu = returns
    .slice(header + 1)
    .filter(
      (row) =>
        typeof row[0] === 'number' &&
        Number.isInteger(row[0]) &&
        row[0] >= 1928 &&
        row[0] <= lastCompleteYear,
    )
    .map((row) => ({
      year: numeric(row[0], 'year'),
      us_stocks: numeric(row[1], 'stock total return'),
      us_bonds: numeric(row[4], 'Treasury total return'),
      usd_cash: numeric(row[3], 'Treasury bill return'),
      us_home: numeric(row[6], 'home price return'),
    }));
  if (nyu.length < 10 || nyu.some((r, i) => r.year !== 1928 + i))
    throw new Error(
      'NYU calendar-year data are missing, duplicated, or unordered',
    );
  const decode = (id: Exclude<PublicSourceId, 'NYU'>) =>
    readFredCsv(new TextDecoder().decode(raw[id]), id);
  const cpi = decode('CPIAUCNS'),
    china = decode('FPCPITOTLZGCHN'),
    fx = decode('DEXCHUS'),
    bond = decode('DGS10');
  const latestDecember = Math.max(
    ...Array.from(cpi.keys())
      .filter((date) => date.slice(5, 7) === '12')
      .map((date) => Number(date.slice(0, 4))),
  );
  const end = Math.min(nyu.at(-1)!.year, latestDecember, lastCompleteYear);
  const usCpi = annualUSCpi(cpi, end),
    history = nyu
      .filter((r) => r.year <= end)
      .map((r, i) => ({ ...r, us_cpi: usCpi[i].us_cpi })) as HistoricalRow[];
  const chinaEnd = Math.min(
    end,
    Number(latest(china, 'China CPI')[0].slice(0, 4)),
  );
  const chinaCpi = annualChinaCpi(china, chinaEnd),
    yearEndFx = annualFx(fx, end);
  const rawStocks = workbookRows(book, 'S&P 500 & Raw Data');
  const stockHeader = rawStocks.findIndex(
    (row) =>
      row[0] === 'Year' &&
      row[1] === 'S&P 500' &&
      row[2] === 'Dividends' &&
      row[3] === 'Dividend Yield',
  );
  if (stockHeader < 0) throw new Error('NYU dividend headers changed');
  const stockRows = rawStocks.slice(stockHeader + 1),
    stock = stockRows.find((row) => row[0] === end),
    previous = stockRows.find((row) => row[0] === end - 1);
  if (!stock || !previous)
    throw new Error(`NYU dividend data missing for ${end}`);
  const dividends = numeric(stock[2], 'dividends'),
    openingLevel = numeric(previous[1], 'beginning-year index level'),
    stockYield = numeric(stock[3], 'dividend yield');
  if (
    openingLevel <= 0 ||
    Math.abs(stockYield - dividends / openingLevel) > 1e-12
  )
    throw new Error('NYU dividend yield denominator changed');
  const [bondDate, bondPercent] = latest(bond, 'DGS10'),
    [fxDate, fxValue] = latest(fx, 'DEXCHUS'),
    [cnDate, cnPercent] = latest(china, 'China CPI');
  const [usDate, usIndex] = latest(cpi, 'CPIAUCNS'),
    previousUsDate = `${Number(usDate.slice(0, 4)) - 1}${usDate.slice(4)}`,
    previousUsIndex = cpi.get(previousUsDate);
  if (previousUsIndex === undefined || previousUsIndex <= 0 || usIndex <= 0)
    throw new Error('Latest US year-over-year CPI pair is missing/nonpositive');
  const data: MarketDataSnapshot = {
    format_version: MARKET_DATA_FORMAT,
    fetched_at: fetchedAt,
    sha256: '',
    history,
    china_cpi: chinaCpi,
    usd_cny: yearEndFx,
    income_yields: {
      us_stocks: {
        value: stockYield,
        date: `${end}-12-31`,
        source_id: 'NYU',
        numerator: dividends,
        denominator: openingLevel,
        definition:
          'Calendar-year S&P 500 dividends divided by beginning-year S&P index level. Income share of total return.',
      },
      us_bonds: {
        value: bondPercent / 100,
        date: bondDate,
        source_id: 'DGS10',
        definition:
          '10-year constant-maturity Treasury par yield, used as an income proxy for a par Treasury portfolio. Not existing holdings’ coupon income or added return.',
      },
    },
    latest: {
      usd_cny: {
        value: fxValue,
        date: fxDate,
        source_id: 'DEXCHUS',
        definition: 'Latest available daily CNY per USD observation.',
      },
      cn_cpi: {
        value: cnPercent / 100,
        date: cnDate,
        source_id: 'FPCPITOTLZGCHN',
        definition:
          'China annual-average CPI percentage change, divided by 100.',
      },
      us_cpi: {
        value: usIndex / previousUsIndex - 1,
        date: usDate,
        source_id: 'CPIAUCNS',
        definition:
          'Latest monthly US non-seasonally-adjusted CPI relative to the same month one year earlier. Historical rows use December-to-December change.',
      },
    },
    sources: (Object.keys(PUBLIC_MARKET_SOURCES) as PublicSourceId[]).map(
      (id) => ({
        id,
        url: PUBLIC_MARKET_SOURCES[id],
        retrieved_at: fetchedAt,
        sha256: createHash('sha256').update(raw[id]).digest('hex'),
        bytes: raw[id].byteLength,
      }),
    ),
  };
  data.sha256 = marketDataHash(data);
  return validateMarketData(data);
}
export async function fetchPublicMarketData(
  fetchSource = fetchPublicSource,
): Promise<{ data: Readonly<MarketDataSnapshot>; raw: PublicSourceBytes }> {
  const ids = Object.keys(PUBLIC_MARKET_SOURCES) as PublicSourceId[];
  const results = await Promise.allSettled(
    ids.map(async (id) => [id, await fetchSource(id)] as const),
  );
  const failures = results.flatMap((r, i) =>
    r.status === 'rejected'
      ? [
          `${ids[i]}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`,
        ]
      : [],
  );
  if (failures.length)
    throw new Error(
      `Public market refresh failed (${failures.join('; ')}). No data applied.`,
    );
  const raw = Object.fromEntries(
    results.map(
      (r) =>
        (r as PromiseFulfilledResult<readonly [PublicSourceId, Uint8Array]>)
          .value,
    ),
  ) as PublicSourceBytes;
  return { data: parsePublicMarketSources(raw), raw };
}
