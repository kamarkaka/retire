import { it, expect } from 'vitest';
import XLSX from 'xlsx';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'retire-biff-test-')),
    out = join(root, 'out'),
    headers = ['Year', 'Stocks', 'Bonds', 'Cash', 'CPI', 'Home'];
  const rows: unknown[][] = [
    headers,
    ...Array.from({ length: 98 }, (_, i) => [
      1928 + i,
      10 + (i % 7),
      5 + (i % 3),
      2 + (i % 2),
      3 + (i % 4),
      4 + (i % 5),
    ]),
  ];
  const mapping = {
    sheet: 'Explicit returns',
    header_row: 1,
    returns_unit: 'percent',
    columns: {
      year: 'Year',
      us_stocks: 'Stocks',
      us_bonds: 'Bonds',
      usd_cash: 'Cash',
      us_cpi: 'CPI',
      us_home: 'Home',
    },
  };
  await writeFile(join(root, 'columns.json'), JSON.stringify(mapping));
  await writeFile(
    join(root, 'source-manifest.json'),
    JSON.stringify({
      source_url: 'https://example.invalid/synthetic-test',
      retrieved_at: '2026-10-18T00:00:00Z',
      edition: 'Synthetic test only',
      source_notes: 'Not observed data; never clears a source gate',
    }),
  );
  const writeWorkbook = async () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet(rows),
      mapping.sheet,
    );
    const bytes = XLSX.write(book, {
      type: 'buffer',
      bookType: 'biff8',
    }) as Buffer;
    await writeFile(join(root, 'history.xls'), bytes);
    return bytes;
  };
  const run = () =>
    execFileSync(
      process.execPath,
      [
        resolve('node_modules/tsx/dist/cli.mjs'),
        'scripts/import-data.ts',
        '--source-dir',
        root,
        '--out-dir',
        out,
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  return { root, out, rows, mapping, writeWorkbook, run };
}
it('M03 imports a real BIFF8 byte stream with explicit units, 98 rows and provenance hashes', async () => {
  const f = await fixture();
  try {
    const bytes = await f.writeWorkbook();
    f.run();
    const history = JSON.parse(
        await readFile(join(f.out, 'history.json'), 'utf8'),
      ),
      provenance = JSON.parse(
        await readFile(join(f.out, 'provenance.json'), 'utf8'),
      ),
      calibration = JSON.parse(
        await readFile(join(f.out, 'calibration.json'), 'utf8'),
      );
    expect(history).toHaveLength(98);
    expect(history[0]).toEqual({
      year: 1928,
      us_stocks: 0.1,
      us_bonds: 0.05,
      usd_cash: 0.02,
      us_cpi: 0.03,
      us_home: 0.04,
    });
    expect(provenance.source_sha256).toBe(
      createHash('sha256').update(bytes).digest('hex'),
    );
    expect(provenance.kind).toBe('imported-unverified');
    expect(calibration.moments.us_stocks.mean).toBeCloseTo(0.13, 14);
    expect(calibration.moments.us_stocks.sd).toBeCloseTo(0.02, 14);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
it('M03 rejects display strings, undeclared units, duplicate years and renamed CSV', async () => {
  const f = await fixture();
  try {
    f.rows[1][1] = '10%';
    await f.writeWorkbook();
    expect(f.run).toThrow(/Nonnumeric cell/);
    f.rows[1][1] = 10;
    f.rows[2][0] = 1928;
    await f.writeWorkbook();
    expect(f.run).toThrow(/exactly one complete joint row/);
    f.rows[2][0] = 1929;
    await writeFile(
      join(f.root, 'columns.json'),
      JSON.stringify({ ...f.mapping, returns_unit: 'guess' }),
    );
    expect(f.run).toThrow(/returns_unit/);
    await writeFile(join(f.root, 'columns.json'), JSON.stringify(f.mapping));
    await writeFile(join(f.root, 'history.xls'), 'Year,Stocks\n1928,10');
    expect(f.run).toThrow(/BIFF8/);
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});
