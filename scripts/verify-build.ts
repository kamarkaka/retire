import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { applicationInputsHash } from './build-inputs';
import { BUILD_SOURCE_SHA256, BUILD_VERSION } from '../src/build-info';
const inputs = await applicationInputsHash(),
  checks: { name: string; status: 'PASS' | 'FAIL'; detail: unknown }[] = [],
  files: { path: string; bytes: number; sha256: string }[] = [],
  texts: string[] = [];
const check = (name: string, ok: boolean, detail: unknown = {}) =>
  checks.push({ name, status: ok ? 'PASS' : 'FAIL', detail });
async function visit(dir: string) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await visit(path);
    else {
      const bytes = await readFile(path);
      files.push({
        path,
        bytes: bytes.byteLength,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
      texts.push(bytes.toString('utf8'));
    }
  }
}
await visit('dist');
const bundle = texts.join('\n');
check(
  'build fingerprint matches current application and lockfile',
  inputs.sha256 === BUILD_SOURCE_SHA256,
  { expected: inputs.sha256, actual: BUILD_SOURCE_SHA256 },
);
check(
  'compiled bundle contains its exact fingerprint',
  bundle.includes(BUILD_VERSION),
  { build_version: BUILD_VERSION },
);
const forbidden = [
  'Development verification',
  'Literal M00 oracles',
  'CONTROL-PV',
  'verification/fixtures',
  'Test-only local note 南京 🏡',
];
check(
  'development harness/oracles/private test notes absent',
  forbidden.every((text) => !bundle.includes(text)),
  { forbidden },
);
check(
  'static distribution excludes raw/config/report files',
  files.every(
    (f) =>
      !/(?:\.toml$|\.xlsx?$|verification\/|private\/|data\/raw\/)/.test(f.path),
  ),
  { files: files.map((f) => f.path) },
);
const modelFiles = (await readdir('src/model')).filter((f) =>
  f.endsWith('.ts'),
);
for (const file of modelFiles) {
  const source = await readFile(join('src/model', file), 'utf8');
  check(
    `pure model imports: ${file}`,
    !/(?:from\s*|import\s*)['"](?:react|node:|[^'"]*components\/)/.test(source),
  );
}
const status = checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL';
await mkdir('verification/records', { recursive: true });
await writeFile(
  'verification/records/build-results.json',
  JSON.stringify(
    {
      status,
      checked_at: new Date().toISOString(),
      build_source_sha256: BUILD_SOURCE_SHA256,
      build_version: BUILD_VERSION,
      input_files: inputs.files,
      files,
      checks,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify(
    {
      status,
      checks: checks.length,
      files: files.map((f) => ({ path: f.path, bytes: f.bytes })),
    },
    null,
    2,
  ),
);
if (status === 'FAIL') {
  console.error(checks.filter((c) => c.status === 'FAIL'));
  process.exitCode = 1;
}
