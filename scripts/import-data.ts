// Development importer only. The static product never reads this directory or workbook.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import XLSX from 'xlsx';
import { hashBytes, hashObject } from '../src/model/canonical';
import { calibrateHistory, SERIES } from '../src/reference/calibration';
import type { HistoricalRow } from '../src/model/types';
import { annualUSCpi, readFredCsv } from '../src/reference/fred';

const args = process.argv.slice(2),
  value = (flag: string) =>
    args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
const sourceDir = value('--source-dir');
if (!sourceDir)
  throw new Error(
    'Provide --source-dir with history.xls, columns.json and source-manifest.json; no substitute rows are generated.',
  );
const workbook = resolve(sourceDir, value('--workbook') ?? 'history.xls'),
  bytes = new Uint8Array(await readFile(workbook));
if (
  ![0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every(
    (v, i) => bytes[i] === v,
  )
)
  throw new Error(
    'Expected a BIFF8/OLE .xls workbook; CSV or XLSX renamed to .xls is unsupported',
  );
const mapping = JSON.parse(
  await readFile(resolve(sourceDir, 'columns.json'), 'utf8'),
) as {
  sheet: string;
  header_row: number;
  columns: Record<'year' | (typeof SERIES)[number], string>;
  returns_unit: 'decimal' | 'percent';
};
if (
  !['decimal', 'percent'].includes(mapping.returns_unit) ||
  !Number.isSafeInteger(mapping.header_row) ||
  mapping.header_row < 1
)
  throw new Error(
    'Declare returns_unit as decimal or percent and a positive header_row',
  );
const sourceManifest = JSON.parse(
  await readFile(resolve(sourceDir, 'source-manifest.json'), 'utf8'),
) as Record<string, unknown>;
if (
  !sourceManifest.source_url ||
  !sourceManifest.retrieved_at ||
  !sourceManifest.edition
)
  throw new Error('Provenance requires source_url, retrieved_at and edition');
const book = XLSX.read(bytes, { type: 'array' }),
  sheet = book.Sheets[mapping.sheet];
if (!sheet) throw new Error(`Missing exact worksheet ${mapping.sheet}`);
const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  }),
  headers = raw[mapping.header_row - 1];
if (!Array.isArray(headers))
  throw new Error('The declared header row is absent');
const columns = Object.fromEntries(
  ['year', ...SERIES].map((k) => {
    const name = mapping.columns[k as keyof typeof mapping.columns],
      index = headers.indexOf(name);
    if (index < 0 || headers.lastIndexOf(name) !== index)
      throw new Error(`Missing or ambiguous exact header ${name}`);
    return [k, index];
  }),
);
const rows: HistoricalRow[] = [];
for (const row of raw.slice(mapping.header_row)) {
  const year = row[columns.year];
  if (
    typeof year !== 'number' ||
    !Number.isInteger(year) ||
    year < 1928 ||
    year > 2025
  )
    continue;
  const record = { year } as HistoricalRow;
  for (const key of SERIES) {
    const v = row[columns[key]];
    if (typeof v !== 'number' || !Number.isFinite(v))
      throw new Error(
        `Nonnumeric cell ${year}/${key}; formula display strings are not silently substituted`,
      );
    record[key] = v / (mapping.returns_unit === 'percent' ? 100 : 1);
  }
  rows.push(record);
}
rows.sort((a, b) => a.year - b.year);
if (rows.length !== 98 || rows.some((r, i) => r.year !== 1928 + i))
  throw new Error(
    'Need exactly one complete joint row for every year 1928–2025',
  );
let usCpiSource: Record<string, unknown> | undefined;
const cpiFile = value('--us-cpi-csv');
if (cpiFile) {
  const manifestFile = value('--us-cpi-manifest');
  if (!manifestFile)
    throw new Error(
      'FRED CPI import requires --us-cpi-manifest with source metadata',
    );
  const cpiBytes = new Uint8Array(await readFile(resolve(cpiFile))),
    cpi = annualUSCpi(
      readFredCsv(new TextDecoder().decode(cpiBytes), 'CPIAUCNS'),
    );
  const metadata = JSON.parse(
    await readFile(resolve(manifestFile), 'utf8'),
  ).CPIAUCNS;
  if (
    !metadata?.source_url ||
    !metadata.retrieved_at ||
    metadata.source_sha256 !== hashBytes(cpiBytes)
  )
    throw new Error('FRED CPI provenance/hash mismatch');
  rows.forEach((r, i) => (r.us_cpi = cpi[i].us_cpi));
  usCpiSource = {
    ...metadata,
    series: 'CPIAUCNS',
    convention:
      'December CPI / preceding December CPI - 1; not seasonally adjusted',
  };
}
const output = resolve(value('--out-dir') ?? 'data/imported');
await mkdir(output, { recursive: true });
const calibration = calibrateHistory(rows),
  manifest = {
    ...sourceManifest,
    ...(usCpiSource ? { us_cpi_source: usCpiSource } : {}),
    kind: 'imported-unverified',
    source_sha256: hashBytes(bytes),
    history_sha256: hashObject(rows),
    calibration_sha256: hashObject(calibration),
    mapping,
    rows: rows.length,
    status:
      'Imported, pending independent raw-cell/source acceptance; does not verify legal rules',
  };
await writeFile(
  resolve(output, 'history.json'),
  JSON.stringify(rows, null, 2) + '\n',
);
await writeFile(
  resolve(output, 'calibration.json'),
  JSON.stringify(calibration, null, 2) + '\n',
);
await writeFile(
  resolve(output, 'provenance.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(JSON.stringify(manifest, null, 2));
