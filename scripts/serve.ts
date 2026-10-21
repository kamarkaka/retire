// Production server: static app, server-managed market data, refresh scheduler.
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import {
  marketDataMiddleware,
  fileMarketDataLoader,
} from './market-data-gateway';
import { refreshMarketData } from './market-data-refresh';
import { staticHandler } from './static-files';

const port = Number(process.env.PORT ?? 8080);
const dataDir = process.env.DATA_DIR ?? 'data/live';
const refreshHours = Number(process.env.MARKET_DATA_REFRESH_HOURS ?? 720);
const basePath =
  process.env.BASE_PATH && process.env.BASE_PATH !== '/'
    ? process.env.BASE_PATH.replace(/\/+$/, '')
    : '/';
if (!Number.isFinite(port) || port <= 0)
  throw new Error('PORT must be a positive integer');
if (!Number.isFinite(refreshHours) || refreshHours < 0)
  throw new Error('MARKET_DATA_REFRESH_HOURS must be >= 0');

const marketData = marketDataMiddleware(fileMarketDataLoader(dataDir));
const serveStatic = staticHandler(resolve('dist'), [basePath]);
createServer((req, res) => {
  void marketData(req, res, () => {
    void serveStatic(req, res);
  });
}).listen(port, () =>
  console.log(
    JSON.stringify({
      status: 'serving',
      port,
      dataDir,
      refreshHours,
      basePath,
    }),
  ),
);

async function tick() {
  try {
    const status = await refreshMarketData({ dataDir });
    console.log(JSON.stringify({ job: 'market-refresh', ...status }));
  } catch (e) {
    console.error(
      JSON.stringify({
        job: 'market-refresh',
        status: 'ERROR',
        error: e instanceof Error ? e.message : String(e),
      }),
    );
  }
  if (refreshHours > 0)
    setTimeout(() => void tick(), refreshHours * 3600_000).unref();
}
if (refreshHours > 0) void tick();
else console.log(JSON.stringify({ job: 'market-refresh', status: 'disabled' }));
