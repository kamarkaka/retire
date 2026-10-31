import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchPublicMarketData } from './market-data-source.ts';
import {
  parseMarketData,
  type MarketDataSnapshot,
} from '../src/reference/market-data.ts';

/** Read-only public-data endpoint. It accepts no scenario, URL, file path, or request body. */
export function marketDataMiddleware(
  load: () => Promise<Readonly<MarketDataSnapshot>> = async () =>
    (await fetchPublicMarketData()).data,
) {
  let pending: Promise<Readonly<MarketDataSnapshot>> | undefined;
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.endsWith('/api/market-data')) {
      next();
      return;
    }
    const reply = (status: number, value: unknown) => {
      if (!res.destroyed) {
        res.writeHead(status, {
          'content-type': 'application/json',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        res.end(JSON.stringify(value));
      }
    };
    if (req.method !== 'GET') {
      reply(405, { error: 'Market refresh requires GET.' });
      return;
    }
    if (
      url.search ||
      req.headers['transfer-encoding'] ||
      Number(req.headers['content-length'] ?? 0) > 0
    ) {
      reply(400, { error: 'Market refresh accepts no parameters or body.' });
      return;
    }
    if (req.headers['sec-fetch-site'] === 'cross-site') {
      reply(403, { error: 'Open the retirement app to refresh market data.' });
      return;
    }
    try {
      // Concurrent requests share one bounded load; later requests load again.
      pending ??= load().finally(() => {
        pending = undefined;
      });
      reply(200, await pending);
    } catch (error) {
      reply(502, {
        error:
          error instanceof Error
            ? error.message
            : 'Public market sources could not be refreshed.',
      });
    }
  };
}
/**
 * Serves the cron-maintained package. Missing or invalid files surface as a
 * 502 through the middleware, and the client falls back to bundled data.
 */
export function fileMarketDataLoader(
  dataDir: string,
): () => Promise<Readonly<MarketDataSnapshot>> {
  return async () => {
    let text: string;
    try {
      text = await readFile(join(dataDir, 'market-data.json'), 'utf8');
    } catch {
      throw new Error('No server market data is available yet.');
    }
    return parseMarketData(text);
  };
}
export function publicMarketDataPlugin(): Plugin {
  return {
    name: 'retire-public-market-data',
    configureServer(server) {
      server.middlewares.use(marketDataMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(marketDataMiddleware());
    },
  };
}
