// Development-only static host for production browser tests, mounted at / and /retire/.
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  marketDataMiddleware,
  fileMarketDataLoader,
} from './market-data-gateway';
import { staticHandler } from './static-files';
import { references } from '../src/reference/bundle';
// The browser suite asserts the server-managed contract: the gateway serves a
// frozen file, seeded here from the bundled package so runs stay deterministic.
if (!references.market_data) throw new Error('Bundled market data missing');
const dataDir = join(tmpdir(), `retire-test-market-data-${process.pid}`);
await mkdir(dataDir, { recursive: true });
await writeFile(
  join(dataDir, 'market-data.json'),
  JSON.stringify(references.market_data) + '\n',
);
const marketData = marketDataMiddleware(fileMarketDataLoader(dataDir));
const serveStatic = staticHandler(resolve('dist'), ['/retire']);
createServer((req, res) => {
  void marketData(req, res, () => {
    void serveStatic(req, res);
  });
}).listen(4173, '127.0.0.1', () =>
  console.log(
    'Test build and public-data gateway: http://127.0.0.1:4173/ and /retire/',
  ),
);
