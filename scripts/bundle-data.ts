// Development-only activation of already imported and independently checked
// public references. The browser never reads these source directories.
import { readFile, writeFile } from 'node:fs/promises';
import { hashBytes, hashObject } from '../src/model/canonical';
import { calibrateHistory } from '../src/reference/calibration';
import { calibrateChinaFx } from '../src/reference/fred';
import type { HistoricalRow } from '../src/model/types';

const json = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
const source = 'verification/sources/nyu-historical-returns-1928-2025',
  fred = 'verification/sources/fred';
const history: HistoricalRow[] = await json('data/imported/history.json'),
  imported = await json('data/imported/provenance.json');
const workbook = await json(`${source}/independent-acceptance.json`),
  fredChecked = await json(`${fred}/independent-acceptance.json`),
  fredSources = await json(`${fred}/source-manifest.json`);
for (const [receipt, reader, directory] of [
  [workbook, 'read-historical-source.py', source],
  [fredChecked, 'read-fred-source.py', fred],
] as const) {
  if (
    !receipt.status.startsWith('PASS') ||
    receipt.reader_sha256 !==
      hashBytes(
        new Uint8Array(await readFile(`verification/reference/${reader}`)),
      )
  )
    throw new Error(`Independent source receipt failed/stale: ${directory}`);
}
if (
  imported.source_sha256 !==
    hashBytes(new Uint8Array(await readFile(`${source}/history.xls`))) ||
  workbook.source_sha256 !== imported.source_sha256
)
  throw new Error('Workbook provenance mismatch');
for (const series of ['CPIAUCNS', 'FPCPITOTLZGCHN', 'DEXCHUS']) {
  const hash = hashBytes(
    new Uint8Array(await readFile(`${fred}/${series}.csv`)),
  );
  if (
    hash !== fredChecked.source_sha256[series] ||
    hash !== fredSources[series].source_sha256
  )
    throw new Error(`FRED provenance mismatch: ${series}`);
}
const independentlyMerged = workbook.independent_rows.map(
  (r: HistoricalRow, i: number) => ({
    ...r,
    us_cpi: fredChecked.us_cpi[i].us_cpi,
  }),
);
if (
  history.length !== 98 ||
  hashObject(history) !== hashObject(independentlyMerged) ||
  hashObject(history) !== imported.history_sha256
)
  throw new Error(
    'Imported joint history differs from independently checked NYU/FRED rows',
  );
if (
  imported.us_cpi_source?.source_sha256 !== fredSources.CPIAUCNS.source_sha256
)
  throw new Error('December CPI was not imported');
const calibration = calibrateHistory(history),
  observedCalibration = calibrateChinaFx(
    fredChecked.cn_cpi,
    fredChecked.usdcny,
  );
if (hashObject(calibration) !== imported.calibration_sha256)
  throw new Error('Imported calibration mismatch');
const provenance = {
  ...imported,
  kind: 'observed-historical',
  version: 'nyu-fred-1928-2025-v1',
  observed_historical_rows: true,
  historical_source_status:
    'CHECKED: 392 NYU return cells and 98 FRED December-to-December CPI rates; 98 consecutive joint years',
  source_notes: {
    ...imported.source_notes,
    us_cpi:
      'FRED CPIAUCNS December index / preceding December index - 1; not the workbook inflation column',
  },
  coverage_note:
    'US annual series use observed NYU/FRED history. Observed China CPI and year-end USD/CNY supply calibration references; configured AR(1)/FX parameters generate future paths. Medical growth, distribution yields and property-specific adjustments remain assumptions.',
  independent_acceptance_sha256: hashBytes(
    new Uint8Array(await readFile(`${source}/independent-acceptance.json`)),
  ),
  independent_reader_sha256: workbook.reader_sha256,
  fred_sources: fredSources,
  fred_independent_acceptance_sha256: hashBytes(
    new Uint8Array(await readFile(`${fred}/independent-acceptance.json`)),
  ),
  fred_independent_reader_sha256: fredChecked.reader_sha256,
  china_cpi_sha256: hashObject(fredChecked.cn_cpi),
  usdcny_sha256: hashObject(fredChecked.usdcny),
  china_fx_calibration_sha256: hashObject(observedCalibration),
  legal_source_status: 'unverified',
  status:
    'Observed annual references bundled; raw-cell fidelity and independent population calibration checked; provider methodology and legal rules remain separate',
};
for (const [file, value] of [
  ['history.json', history],
  ['cn-cpi.json', fredChecked.cn_cpi],
  ['usdcny.json', fredChecked.usdcny],
  ['provenance.json', provenance],
] as const)
  await writeFile(
    `src/reference/${file}`,
    JSON.stringify(value, null, 2) + '\n',
  );
console.log(
  JSON.stringify(
    {
      status: 'PASS: observed references activated',
      version: provenance.version,
      rows: {
        us: history.length,
        china: fredChecked.cn_cpi.length,
        fx: fredChecked.usdcny.length,
      },
      history_sha256: provenance.history_sha256,
      china_fx_calibration: observedCalibration,
    },
    null,
    2,
  ),
);
