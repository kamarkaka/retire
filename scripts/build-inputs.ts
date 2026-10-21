import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
export async function applicationInputsHash() {
  const files = [
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'tsconfig.json',
    'index.html',
    'scripts/build-info.ts',
    'scripts/build-inputs.ts',
    'scripts/market-data-source.ts',
    'scripts/market-data-gateway.ts',
  ];
  async function visit(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (
        path === 'src/build-info.ts' ||
        path === 'src/verification' ||
        path === 'src/workers/probe.ts' ||
        path === 'src/workers/probe.worker.ts'
      )
        continue;
      if (entry.isDirectory()) await visit(path);
      else files.push(path);
    }
  }
  await visit('src');
  files.sort();
  const hash = createHash('sha256');
  for (const path of files) {
    const content = await readFile(path);
    hash.update(`${path}\0${content.byteLength}\0`);
    hash.update(content);
  }
  return { sha256: hash.digest('hex'), files };
}
