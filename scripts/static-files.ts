import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const mime: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

/** Static file handler with mount-prefix stripping and SPA fallback. */
export function staticHandler(root: string, stripPrefixes: string[]) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405);
      res.end();
      return;
    }
    try {
      let path = decodeURIComponent(
        new URL(req.url!, 'http://127.0.0.1').pathname,
      );
      for (const prefix of stripPrefixes)
        if (path === prefix || path.startsWith(`${prefix}/`))
          path = path.slice(prefix.length) || '/';
      let file = resolve(root, `.${path}`);
      if (file !== root && !file.startsWith(root + sep)) {
        res.writeHead(400);
        res.end();
        return;
      }
      try {
        if ((await stat(file)).isDirectory())
          file = resolve(file, 'index.html');
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
  };
}
