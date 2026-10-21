import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { fetchPublicMarketData } from './market-data-source.ts';
import type { MarketDataSnapshot } from '../src/reference/market-data.ts';

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
      // Concurrent clicks share one bounded fetch; subsequent clicks always fetch fresh sources.
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
