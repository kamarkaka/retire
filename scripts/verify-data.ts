import {
  references,
  REFERENCE_LABEL,
  REFERENCE_PROVENANCE,
  CHINA_CPI_REFERENCE,
  FX_REFERENCE,
  OBSERVED_CALIBRATION,
} from '../src/reference/bundle';
import { hashBytes, hashObject } from '../src/model/canonical';
import { calibrateHistory, SERIES } from '../src/reference/calibration';
import type { HistoricalRow } from '../src/model/types';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { parseMarketData } from '../src/reference/market-data';
import XLSX from 'xlsx';
import {
  readFredCsv,
  annualUSCpi,
  annualChinaCpi,
  annualFx,
  calibrateChinaFx,
} from '../src/reference/fred';

const source = 'verification/sources/nyu-historical-returns-1928-2025';
const raw = new Uint8Array(await readFile(`${source}/history.xls`));
const receiptBytes = new Uint8Array(
  await readFile(`${source}/independent-acceptance.json`),
);
const receipt = JSON.parse(new TextDecoder().decode(receiptBytes)) as {
  status: string;
  reader_sha256: string;
  source_sha256: string;
  independent_rows: HistoricalRow[];
  rows_checked: number;
  return_cells_checked: number;
  year_cells_checked: number;
  moments: ReturnType<typeof calibrateHistory>['moments'];
  correlation: (number | null)[][];
  crisis_rows: HistoricalRow[];
  calendar_replays: unknown;
  stock_geometric_mean: number;
  portfolio_40_60_geometric_mean: number;
};
const provenance = REFERENCE_PROVENANCE,
  h = references.history;
const fredDir = 'verification/sources/fred',
  fredBytes = new Uint8Array(
    await readFile(`${fredDir}/independent-acceptance.json`),
  );
const fredReceipt = JSON.parse(new TextDecoder().decode(fredBytes));
if (
  !fredReceipt.status.startsWith('PASS') ||
  hashBytes(fredBytes) !== provenance.fred_independent_acceptance_sha256 ||
  hashBytes(
    new Uint8Array(
      await readFile('verification/reference/read-fred-source.py'),
    ),
  ) !== provenance.fred_independent_reader_sha256 ||
  fredReceipt.reader_sha256 !== provenance.fred_independent_reader_sha256 ||
  fredReceipt.nyu_acceptance_sha256 !== provenance.independent_acceptance_sha256
)
  throw new Error('Independent FRED evidence failed/stale');
const fredRaw: Record<string, Uint8Array> = {};
for (const series of ['CPIAUCNS', 'FPCPITOTLZGCHN', 'DEXCHUS'] as const) {
  fredRaw[series] = new Uint8Array(await readFile(`${fredDir}/${series}.csv`));
  if (
    hashBytes(fredRaw[series]) !==
      provenance.fred_sources[series].source_sha256 ||
    hashBytes(fredRaw[series]) !== fredReceipt.source_sha256[series]
  )
    throw new Error(`FRED raw hash mismatch: ${series}`);
}
const usCpi = annualUSCpi(
  readFredCsv(new TextDecoder().decode(fredRaw.CPIAUCNS), 'CPIAUCNS'),
);
const china = annualChinaCpi(
  readFredCsv(
    new TextDecoder().decode(fredRaw.FPCPITOTLZGCHN),
    'FPCPITOTLZGCHN',
  ),
);
const fx = annualFx(
  readFredCsv(new TextDecoder().decode(fredRaw.DEXCHUS), 'DEXCHUS'),
);
for (const [label, actual, expected] of [
  ['US CPI', usCpi, fredReceipt.us_cpi],
  ['China CPI', china, fredReceipt.cn_cpi],
  ['USD/CNY', fx, fredReceipt.usdcny],
  ['bundled China', CHINA_CPI_REFERENCE, china],
  ['bundled FX', FX_REFERENCE, fx],
] as const)
  if (hashObject(actual) !== hashObject(expected))
    throw new Error(`Independent FRED extraction mismatch: ${label}`);
const checkNumbers = (
  actual: unknown,
  expected: unknown,
  path: string,
): void => {
  if (typeof expected === 'number') {
    if (
      typeof actual !== 'number' ||
      !Number.isFinite(actual) ||
      Math.abs(actual - expected) > 1e-12
    )
      throw new Error(`Independent calibration mismatch: ${path}`);
    return;
  }
  if (expected !== null && typeof expected === 'object')
    for (const [key, value] of Object.entries(expected))
      checkNumbers(
        (actual as Record<string, unknown>)[key],
        value,
        `${path}/${key}`,
      );
};
checkNumbers(
  OBSERVED_CALIBRATION.china_calibration,
  fredReceipt.china_calibration,
  'China calibration',
);
checkNumbers(
  OBSERVED_CALIBRATION.fx_calibration,
  fredReceipt.fx_calibration,
  'FX calibration',
);
if (
  hashObject(calibrateChinaFx(china, fx)) !==
    hashObject(OBSERVED_CALIBRATION) ||
  hashObject(OBSERVED_CALIBRATION) !== provenance.china_fx_calibration_sha256
)
  throw new Error('Bundled China/FX calibration mismatch');
if (
  provenance.kind !== 'observed-historical' ||
  !provenance.observed_historical_rows ||
  references.versions.history !== provenance.version
)
  throw new Error('The active bundle is not accepted observed data');
if (
  hashBytes(raw) !== provenance.source_sha256 ||
  receipt.source_sha256 !== provenance.source_sha256
)
  throw new Error('Raw source hash mismatch');
if (
  hashBytes(receiptBytes) !== provenance.independent_acceptance_sha256 ||
  hashBytes(
    new Uint8Array(
      await readFile('verification/reference/read-historical-source.py'),
    ),
  ) !== receipt.reader_sha256 ||
  receipt.reader_sha256 !== provenance.independent_reader_sha256
)
  throw new Error('Independent source evidence changed');
if (
  !receipt.status.startsWith('PASS') ||
  receipt.rows_checked !== 98 ||
  receipt.return_cells_checked !== 490 ||
  receipt.year_cells_checked !== 98
)
  throw new Error('Incomplete independent cell checks');
if (
  h.length !== 98 ||
  h.some(
    (r, i) =>
      r.year !== 1928 + i || Object.values(r).some((v) => !Number.isFinite(v)),
  )
)
  throw new Error('Invalid bundled rows');
if (
  hashObject(h) !== references.hashes.history ||
  references.hashes.history !== provenance.history_sha256 ||
  hashObject(calibrateHistory(h)) !== references.hashes.calibration ||
  references.hashes.calibration !== provenance.calibration_sha256
)
  throw new Error('Reference hash mismatch');

// Reopen the frozen workbook, check exact named headers and compare every active
// value with both raw cells and the independent Python BIFF numeric reader.
const book = XLSX.read(raw, { type: 'array' }),
  sheet = book.Sheets[provenance.mapping.sheet];
if (!sheet) throw new Error('Missing declared historical worksheet');
const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
  header: 1,
  raw: true,
  defval: null,
});
const headers = rows[provenance.mapping.header_row - 1];
const columns = Object.fromEntries(
  ['year', ...SERIES].map((k) => {
    const name =
        provenance.mapping.columns[
          k as keyof typeof provenance.mapping.columns
        ],
      index = headers.indexOf(name);
    if (index < 0 || headers.lastIndexOf(name) !== index)
      throw new Error(`Missing or ambiguous historical header ${name}`);
    return [k, index];
  }),
);
for (let i = 0; i < 98; i++)
  for (const key of ['year', ...SERIES] as const) {
    const v =
      key === 'us_cpi'
        ? usCpi[i].us_cpi
        : rows[provenance.mapping.header_row + i][columns[key]];
    const independent =
      key === 'us_cpi'
        ? fredReceipt.us_cpi[i].us_cpi
        : receipt.independent_rows[i]?.[key];
    if (typeof v !== 'number' || v !== h[i][key] || independent !== h[i][key])
      throw new Error(`Historical source mismatch at ${1928 + i}/${key}`);
  }
const calibration = calibrateHistory(h);
for (const key of SERIES)
  for (const stat of ['mean', 'sd', 'min', 'max'] as const) {
    if (
      Math.abs(
        calibration.moments[key][stat] -
          fredReceipt.us_history_moments[key][stat],
      ) > 1e-12
    )
      throw new Error(
        `Independent population calculation mismatch: ${key}/${stat}`,
      );
  }
for (let i = 0; i < 5; i++)
  for (let j = 0; j < 5; j++) {
    const actual = calibration.correlation[i][j],
      expected = fredReceipt.us_history_correlation[i][j];
    if (
      actual === null ||
      expected === null ||
      Math.abs(actual - expected) > 1e-12
    )
      throw new Error(`Independent correlation mismatch: ${i}/${j}`);
  }
if (references.sources.some((s) => s.status === 'verified'))
  throw new Error('Do not silently upgrade legal-source registry');
const refreshAudit = JSON.parse(
  execFileSync('python3', ['verification/reference/check-refresh-source.py'], {
    encoding: 'utf8',
  }),
);
const refreshed = parseMarketData(
  await readFile(
    'verification/sources/market-refresh/market-data.json',
    'utf8',
  ),
);
if (
  refreshAudit.status !== 'CHECKED' ||
  refreshAudit.package_sha256 !== references.hashes.market_data ||
  refreshed.sha256 !== references.market_data?.sha256
)
  throw new Error(
    'Active market package differs from independently checked refresh sources',
  );
const report = {
  status:
    'PASS: observed US history, all raw cells and independent population calculations',
  label: REFERENCE_LABEL,
  raw_historical_source_status:
    'CHECKED: 98 US joint years, 392 NYU return cells + 98 FRED December CPI rates; China 39 years / FX 45 years',
  provider_methodology_status:
    'Provider definitions recorded; no independent audit of reconstructed indices',
  china_inflation_fx_status:
    'Observed FRED calibration references; future paths use configured AR(1)/FX parameters',
  legal_status: 'OPEN',
  rows: h.length,
  versions: references.versions,
  hashes: references.hashes,
  source: provenance,
  calibration,
  stock_geometric_mean: receipt.stock_geometric_mean,
  portfolio_40_60_geometric_mean: receipt.portfolio_40_60_geometric_mean,
  observed_china_fx_calibration: OBSERVED_CALIBRATION,
  market_refresh_verification: refreshAudit,
  income_yields: references.market_data.income_yields,
  crisis_rows: h.filter((r) => [2000, 2001, 2002, 2008, 2022].includes(r.year)),
  independent_calendar_replays: receipt.calendar_replays,
};
await mkdir('verification/records/M03', { recursive: true });
await writeFile(
  'verification/records/M03/data-report.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      status: report.status,
      raw_historical_source_status: report.raw_historical_source_status,
      rows: h.length,
      versions: references.versions,
      hashes: report.hashes,
    },
    null,
    2,
  ),
);
