/**
 * Scheduled server-side market-data refresh. Fetches the five public
 * sources, runs the independent Python check, and atomically swaps the
 * served package only when the new data validates and does not regress.
 * Failures keep the previous package and record the error in status.json.
 */
import { execFileSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fetchPublicMarketData,
  type PublicSourceId,
} from './market-data-source';
import {
  parseMarketData,
  type MarketDataSnapshot,
} from '../src/reference/market-data';

export interface RefreshStatus {
  checked_at: string;
  status: 'OK' | 'ERROR';
  fetched_at?: string;
  package_sha256?: string;
  history_years?: [number, number];
  swapped?: boolean;
  error?: string;
}

export interface RefreshOptions {
  dataDir: string;
  fetchSources?: typeof fetchPublicMarketData;
  /** Defaults to the independent Python check; injectable for tests. */
  runCheck?: (stagingDir: string) => unknown;
}

type Snapshot = Readonly<MarketDataSnapshot>;

const endYear = (data: Snapshot) => data.history.at(-1)!.year;

async function atomicWrite(path: string, bytes: Uint8Array | string) {
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, bytes);
  await rename(tmp, path);
}

function defaultCheck(stagingDir: string): unknown {
  const output = execFileSync(
    'python3',
    [
      'verification/reference/check-refresh-source.py',
      '--source-dir',
      stagingDir,
    ],
    { encoding: 'utf8', timeout: 120000 },
  );
  return JSON.parse(output);
}

export async function refreshMarketData(
  options: RefreshOptions,
): Promise<RefreshStatus> {
  const { dataDir } = options;
  const fetchSources = options.fetchSources ?? fetchPublicMarketData;
  const runCheck = options.runCheck ?? defaultCheck;
  const record = async (status: RefreshStatus): Promise<RefreshStatus> => {
    await mkdir(dataDir, { recursive: true });
    await atomicWrite(
      join(dataDir, 'status.json'),
      JSON.stringify(status, null, 2) + '\n',
    );
    return status;
  };
  const fail = (error: string) =>
    record({
      checked_at: new Date().toISOString(),
      status: 'ERROR',
      error,
    });

  let fetched: Awaited<ReturnType<typeof fetchPublicMarketData>>;
  try {
    fetched = await fetchSources();
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
  const { data, raw } = fetched;
  const staging = await mkdtemp(join(tmpdir(), 'market-refresh-'));
  try {
    for (const [id, bytes] of Object.entries(raw) as [
      PublicSourceId,
      Uint8Array,
    ][])
      await writeFile(
        join(staging, id === 'NYU' ? 'history.xls' : `${id}.csv`),
        bytes,
      );
    const packageBytes = JSON.stringify(data, null, 2) + '\n';
    await writeFile(join(staging, 'market-data.json'), packageBytes);
    let report: { status?: unknown };
    try {
      report = runCheck(staging) as { status?: unknown };
    } catch (e) {
      return fail(
        `Independent check failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    if (report?.status !== 'CHECKED')
      return fail('Independent check did not pass');

    let current: Snapshot | undefined;
    try {
      current = parseMarketData(
        await readFile(join(dataDir, 'market-data.json'), 'utf8'),
      );
    } catch {
      current = undefined;
    }
    if (current) {
      if (endYear(data) < endYear(current))
        return fail(
          `New package ends at ${endYear(data)}; current ends at ${endYear(current)}. Previous data preserved.`,
        );
      if (data.sha256 === current.sha256)
        return record({
          checked_at: new Date().toISOString(),
          status: 'OK',
          fetched_at: data.fetched_at,
          package_sha256: data.sha256,
          history_years: [data.history[0].year, endYear(data)],
          swapped: false,
        });
    }
    await mkdir(join(dataDir, 'sources'), { recursive: true });
    await atomicWrite(join(dataDir, 'market-data.json'), packageBytes);
    for (const name of [
      'history.xls',
      'CPIAUCNS.csv',
      'FPCPITOTLZGCHN.csv',
      'DEXCHUS.csv',
      'DGS10.csv',
      'independent-acceptance.json',
    ] as const)
      await atomicWrite(
        join(dataDir, 'sources', name),
        await readFile(join(staging, name)),
      );
    return record({
      checked_at: new Date().toISOString(),
      status: 'OK',
      fetched_at: data.fetched_at,
      package_sha256: data.sha256,
      history_years: [data.history[0].year, endYear(data)],
      swapped: true,
    });
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

// One-shot CLI: npm run market:refresh -- --data-dir <dir>
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  const args = process.argv.slice(2);
  if (
    args.some((arg, i) => arg !== '--data-dir' && args[i - 1] !== '--data-dir')
  )
    throw new Error('Usage: npm run market:refresh -- --data-dir <directory>');
  const index = args.indexOf('--data-dir');
  const dataDir =
    (index >= 0 && args[index + 1]) || process.env.DATA_DIR || 'data/live';
  const status = await refreshMarketData({ dataDir });
  console.log(JSON.stringify(status, null, 2));
  if (status.status !== 'OK') process.exitCode = 1;
}
