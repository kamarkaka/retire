import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { refreshMarketData } from '../scripts/market-data-refresh';
import {
  marketDataMiddleware,
  fileMarketDataLoader,
} from '../scripts/market-data-gateway';
import { references } from '../src/reference/bundle';
import {
  marketDataHash,
  type MarketDataSnapshot,
} from '../src/reference/market-data';

const bundled = references.market_data!;
const withHash = (data: MarketDataSnapshot): MarketDataSnapshot => ({
  ...structuredClone(data),
  sha256: marketDataHash(data),
});
const packaged = (data: MarketDataSnapshot) =>
  JSON.stringify(data, null, 2) + '\n';

const raw = {
  NYU: new Uint8Array([1, 2]),
  CPIAUCNS: new Uint8Array([3]),
  FPCPITOTLZGCHN: new Uint8Array([4]),
  DEXCHUS: new Uint8Array([5]),
  DGS10: new Uint8Array([6]),
};
const checkOk = (stagingDir: string) => {
  writeFileSync(join(stagingDir, 'independent-acceptance.json'), '{}');
  return { status: 'CHECKED' };
};

let dataDir: string;
beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'refresh-test-'));
});

describe('refreshMarketData', () => {
  it('swaps validated data on first run', async () => {
    const data = withHash({ ...bundled, fetched_at: '2026-10-21T00:00:00Z' });
    const status = await refreshMarketData({
      dataDir,
      fetchSources: async () => ({ data, raw }),
      runCheck: checkOk,
    });
    expect(status.status).toBe('OK');
    expect(status.swapped).toBe(true);
    expect(status.package_sha256).toBe(data.sha256);
    const served = JSON.parse(
      readFileSync(join(dataDir, 'market-data.json'), 'utf8'),
    );
    expect(served.sha256).toBe(data.sha256);
    expect(readFileSync(join(dataDir, 'sources', 'history.xls'))).toEqual(
      Buffer.from([1, 2]),
    );
    const recorded = JSON.parse(
      readFileSync(join(dataDir, 'status.json'), 'utf8'),
    );
    expect(recorded.status).toBe('OK');
  });

  it('skips the swap when the package is identical', async () => {
    writeFileSync(join(dataDir, 'market-data.json'), packaged(bundled));
    const status = await refreshMarketData({
      dataDir,
      fetchSources: async () => ({ data: bundled, raw }),
      runCheck: checkOk,
    });
    expect(status.status).toBe('OK');
    expect(status.swapped).toBe(false);
  });

  it('keeps the current package when the new one regresses', async () => {
    writeFileSync(join(dataDir, 'market-data.json'), packaged(bundled));
    const shorter = withHash({
      ...bundled,
      history: bundled.history.slice(0, -1),
    });
    const status = await refreshMarketData({
      dataDir,
      fetchSources: async () => ({ data: shorter, raw }),
      runCheck: checkOk,
    });
    expect(status.status).toBe('ERROR');
    expect(status.error).toMatch(
      'New package ends at 2024; current ends at 2025',
    );
    const served = JSON.parse(
      readFileSync(join(dataDir, 'market-data.json'), 'utf8'),
    );
    expect(served.sha256).toBe(bundled.sha256);
  });

  it('records fetch failures and preserves the current package', async () => {
    writeFileSync(join(dataDir, 'market-data.json'), packaged(bundled));
    const status = await refreshMarketData({
      dataDir,
      fetchSources: async () => {
        throw new Error('boom');
      },
      runCheck: checkOk,
    });
    expect(status.status).toBe('ERROR');
    expect(status.error).toBe('boom');
    const served = JSON.parse(
      readFileSync(join(dataDir, 'market-data.json'), 'utf8'),
    );
    expect(served.sha256).toBe(bundled.sha256);
  });

  it('rejects packages the independent check does not pass', async () => {
    const data = withHash(bundled);
    const status = await refreshMarketData({
      dataDir,
      fetchSources: async () => ({ data, raw }),
      runCheck: () => ({ status: 'MISMATCH' }),
    });
    expect(status.status).toBe('ERROR');
    expect(status.error).toBe('Independent check did not pass');
    expect(() => readFileSync(join(dataDir, 'market-data.json'))).toThrow();
  });

  it('heals a corrupt current package', async () => {
    writeFileSync(join(dataDir, 'market-data.json'), 'not json');
    const data = withHash(bundled);
    const status = await refreshMarketData({
      dataDir,
      fetchSources: async () => ({ data, raw }),
      runCheck: checkOk,
    });
    expect(status.status).toBe('OK');
    expect(status.swapped).toBe(true);
  });
});

describe('fileMarketDataLoader', () => {
  it('serves the maintained package', async () => {
    writeFileSync(join(dataDir, 'market-data.json'), packaged(bundled));
    const data = await fileMarketDataLoader(dataDir)();
    expect(data.sha256).toBe(bundled.sha256);
    expect(data.history).toHaveLength(bundled.history.length);
  });

  it('throws when no package is available', async () => {
    await expect(fileMarketDataLoader(dataDir)()).rejects.toThrow(
      'No server market data is available yet.',
    );
  });

  it('maps loader failures to a 502 JSON error', async () => {
    const middleware = marketDataMiddleware(async () => {
      throw new Error('No server market data is available yet.');
    });
    let code = 0;
    let body = '';
    const headers: Record<string, string> = {};
    await middleware(
      {
        method: 'GET',
        url: '/api/market-data',
        headers: {},
      } as unknown as IncomingMessage,
      {
        writeHead: (c: number, h: Record<string, string>) => {
          code = c;
          Object.assign(headers, h);
        },
        end: (b?: string) => {
          body = b ?? '';
        },
      } as unknown as ServerResponse,
      () => {
        throw new Error('next should not run');
      },
    );
    expect(code).toBe(502);
    expect(headers['content-type']).toBe('application/json');
    expect(JSON.parse(body).error).toBe(
      'No server market data is available yet.',
    );
  });
});
