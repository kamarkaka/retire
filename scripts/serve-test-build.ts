// Development-only static host for production browser tests, mounted at / and /retire/.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { marketDataMiddleware } from './market-data-gateway';
const marketData = marketDataMiddleware();
const root = resolve('dist'),
  mime: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
  };
createServer((req, res) => {
  void marketData(req, res, () => {
    void serveStatic(req, res);
  });
}).listen(4173, '127.0.0.1', () =>
  console.log(
    'Test build and public-data gateway: http://127.0.0.1:4173/ and /retire/',
  ),
);
async function serveStatic(
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    let path = decodeURIComponent(
      new URL(req.url!, 'http://127.0.0.1').pathname,
    );
    if (path.startsWith('/retire/')) path = path.slice('/retire'.length);
    let file = resolve(root, `.${path}`);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(400);
      res.end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    } catch {
      file = resolve(root, 'index.html');
    }
    const bytes = await readFile(file);
    res.writeHead(200, {
      'content-type': mime[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch {
    res.writeHead(404);
    res.end();
  }
}
