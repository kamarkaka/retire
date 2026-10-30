// Supporting inventory/coverage/provenance checks only; not product or browser execution.
import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { cpus, totalmem, platform, release } from 'node:os';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url)),
  project = resolve(root, '..');
const get = async (p) => JSON.parse(await readFile(resolve(root, p), 'utf8'));
const inventory = await get('config-fields.json'),
  oracles = await get('fixtures/oracles.json'),
  sources = await get('source-gates.json'),
  layout = await get('result-layout.json');
const spec = await readFile(
    resolve(project, 'plan/2026-10-18-retirement-sim-design.md'),
    'utf8',
  ),
  plan = await readFile(
    resolve(project, 'plan/2026-10-18-retirement-sim.md'),
    'utf8',
  );
const checks = [];
function check(name, condition, detail) {
  checks.push({ name, status: condition ? 'PASS' : 'FAIL', detail });
}
const ids = oracles.cases.map((c) => c.id),
  fieldPaths = inventory.fields.map((f) => f.path);
check('unique case IDs', new Set(ids).size === ids.length, {
  count: ids.length,
});
check('unique field paths', new Set(fieldPaths).size === fieldPaths.length, {
  count: fieldPaths.length,
});
const specCaseText = spec.slice(
  spec.indexOf('### 11.1'),
  spec.indexOf('### 11.2'),
);
const requiredSpec = [...specCaseText.matchAll(/^\| ([A-Z]+-\d+)\b/gm)].map(
  (m) => m[1],
);
const requiredPlan = [
  ...new Set(
    [...plan.matchAll(/`([A-Z][A-Z0-9]+(?:-[A-Z0-9]+)+)`/g)].map((m) => m[1]),
  ),
];
check(
  'all spec11.1 cases',
  requiredSpec.every((id) => ids.includes(id)),
  {
    required: requiredSpec,
    missing: requiredSpec.filter((id) => !ids.includes(id)),
  },
);
check(
  'all named plan cases',
  requiredPlan.every((id) => ids.includes(id)),
  {
    required: requiredPlan,
    missing: requiredPlan.filter((id) => !ids.includes(id)),
  },
);
check(
  'frozen M00 implementation labels preserved as historical metadata',
  oracles.cases.every((c) => c.implementation_status === 'NOT IMPLEMENTED'),
  {
    current_execution:
      'records/product-cases.json and records/browser-results.json',
  },
);
check(
  'conditional numeric oracles remain null',
  oracles.cases
    .filter((c) => c.oracle_kind === 'conditional')
    .every((c) => c.expected === null),
  {
    ids: oracles.cases
      .filter((c) => c.oracle_kind === 'conditional')
      .map((c) => c.id),
  },
);
check(
  'all cases have input/manual/provenance',
  oracles.cases.every(
    (c) => c.inputs && c.step && c.provenance && c.manual_instructions.length,
  ),
  {},
);
const sourceIds = new Set(
  [...sources.rows, ...sources.data_gates].map((s) => s.id),
);
check(
  'frozen M00 source registry retains all17 original rows plus residency',
  sources.rows.filter((s) => s.spec_row !== null).length === 17 &&
    sources.rows.some((s) => s.id === 'L-RESIDENCY'),
  { source_rows: sources.rows.length },
);
check(
  'frozen M00 legal-source status preserved; current scoped evidence is separate',
  sources.rows.every(
    (s) =>
      s.status === 'unverified' &&
      s.edition === null &&
      s.checked_at === null &&
      s.evidence.length === 0,
  ),
  {},
);
check(
  'case source IDs resolve',
  oracles.cases.every((c) =>
    c.source_gate_ids.every((id) => sourceIds.has(id)),
  ),
  {},
);
check(
  'field source IDs resolve',
  inventory.fields.every((f) =>
    f.gates.every(
      (id) => id.startsWith('H-') || id === 'LEGAL-ALL' || sourceIds.has(id),
    ),
  ),
  {},
);
const household = await readFile(resolve(root, 'household-gates.md'), 'utf8');
check(
  'field household gates named',
  inventory.fields.every((f) =>
    f.gates
      .filter((id) => id.startsWith('H-'))
      .every((id) => household.includes(id)),
  ),
  {},
);
check(
  'all fields have direct internal/TOML/builder/unit mapping',
  inventory.fields.every(
    (f) =>
      f.path === f.internal_path &&
      f.path === f.serialize_path &&
      f.builder_section &&
      f.builder_control &&
      f.unit &&
      f.omission,
  ),
  {},
);
check(
  'all current fields have plain-English help',
  inventory.fields.every(
    (f) => typeof f.description === 'string' && f.description.length >= 40,
  ),
  { count: inventory.fields.length },
);
const ledgerMatch = spec
  .slice(spec.indexOf('### 7.1'), spec.indexOf('### 7.2'))
  .match(/`year, age_A,[^`]+`/);
const specLedger = ledgerMatch[0].slice(1, -1).split(', ');
check(
  'ledger exact33-field spec order',
  JSON.stringify(specLedger) === JSON.stringify(layout.ledger_fields),
  { count: layout.ledger_fields.length },
);
check(
  'five chart fields are ledger fields',
  layout.chart_fields.length === 5 &&
    layout.chart_fields.every((f) => layout.ledger_fields.includes(f)),
  { chart_fields: layout.chart_fields },
);
const summaryBytes =
  8 * layout.summary_float64_fields.length +
  4 * layout.summary_int32_fields.length +
  layout.summary_uint8_fields.length;
const total = 20000 * (52 * 5 * 4 + summaryBytes);
check(
  'retained20k/T52 bytes below50M',
  total === layout.retained_bytes_20000_paths_52 && total < 50000000,
  { chart_bytes: 20800000, summary_bytes_per_path: summaryBytes, total },
);
check(
  'temporary market samples explicitly budgeted',
  layout.temporary_market_samples_bytes_20000_52 === 20000 * (3 * 52 + 1) * 8 &&
    Object.keys(layout.temporary_market_band_fields).length === 3,
  { temporary_bytes: layout.temporary_market_samples_bytes_20000_52 },
);
const tax = (await get('fixtures/tax-tables.spec.json')).tables;
const ages = Object.keys(tax.us.uniform_lifetime)
  .map(Number)
  .sort((a, b) => a - b);
check(
  'RMD all49 ages72...120',
  ages.length === 49 && ages.every((age, k) => age === 72 + k),
  {},
);
check(
  'positive nonincreasing RMD divisors',
  ages.every(
    (a, k) =>
      tax.us.uniform_lifetime[a] > 0 &&
      (!k ||
        tax.us.uniform_lifetime[a] <= tax.us.uniform_lifetime[ages[k - 1]]),
  ),
  {},
);
check(
  'LTCG rates are explicit',
  JSON.stringify(tax.us.ltcg_rates) === '[0,0.15,0.2]' &&
    JSON.stringify(
      JSON.parse(
        await readFile(
          resolve(project, 'src/reference/tax-tables.json'),
          'utf8',
        ),
      ).us.ltcg_rates,
    ) === '[0,0.15,0.2]' &&
    !fieldPaths.some((p) => p.startsWith('tax_tables')),
  {},
);
const declarations = await readFile(resolve(root, 'contracts.d.ts'), 'utf8');
check(
  'declared boundary/state/settlement types present',
  [
    'DraftScenario',
    'RunnableScenario',
    'RunRequest',
    'ScientificManifest',
    'WorkerRequest',
    'PathSummaryBuffers',
    'TaxSettlement',
    'FtcVintage',
    'TerminalSettlement',
    'MarketPath',
    'IncomeLedger',
  ].every((t) => declarations.includes(t)),
  {},
);
check(
  'R1...R8 traceability exists',
  await readFile(resolve(root, 'traceability.md'), 'utf8').then((t) =>
    Array.from({ length: 8 }, (_, k) => `R${k + 1}`).every((id) =>
      t.includes('| ' + id + ' '),
    ),
  ),
  {},
);
const scripts = (await readdir(resolve(root, 'reference'))).filter((n) =>
  n.endsWith('.mjs'),
);
let imports = [];
for (const name of scripts) {
  const text = await readFile(resolve(root, 'reference', name), 'utf8');
  imports.push(
    ...[...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => ({
      file: name,
      module: m[1],
    })),
  );
}
check(
  'reference scripts never import product',
  imports.every(
    (i) =>
      i.module.startsWith('node:') ||
      [
        './inventory.mjs',
        './field-help.mjs',
        './catalog.mjs',
        './recalculate.mjs',
      ].includes(i.module),
  ),
  { imports },
);
const arithmetic = await get('records/reference-arithmetic.json');
check(
  'independent arithmetic no failures',
  arithmetic.counts.reference_fail === 0,
  { ...arithmetic.counts },
);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
check(
  'arithmetic inputs match current artifacts',
  await Promise.all(
    Object.entries(arithmetic.input_hashes).map(
      async ([p, h]) => hash(await readFile(resolve(root, p))) === h,
    ),
  ).then((rs) => rs.every(Boolean)),
  {},
);
let scaffolding = false;
for (const p of ['package.json', 'package-lock.json', 'src'])
  try {
    await stat(resolve(project, p));
    scaffolding = true;
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
check('M01 scaffolding exists', scaffolding, {});
check(
  'human sign-offs retired by user instruction',
  plan.includes('human sign-offs are retired'),
  {},
);
const report = {
  kind: 'Independent inventory integrity; current product/browser execution is reported separately',
  checked_at: new Date().toISOString(),
  node: process.version,
  checks,
  counts: {
    pass: checks.filter((c) => c.status === 'PASS').length,
    fail: checks.filter((c) => c.status === 'FAIL').length,
  },
  manual_acceptance: 'RETIRED',
  product_execution:
    'See records/product-cases.json and records/browser-results.json',
  legal_verification: 'OPEN',
};
await mkdir(resolve(root, 'records'), { recursive: true });
await writeFile(
  resolve(root, 'records/inventory-integrity.json'),
  JSON.stringify(report, null, 2) + '\n',
);
const files = [];
async function visit(dir) {
  for (const e of (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) await visit(p);
    else if (
      !p.endsWith('artifact-manifest.json') &&
      !p.endsWith('evidence-manifest.json') &&
      !p.endsWith('release.json')
    )
      files.push(p);
  }
}
await visit(root);
for (const name of [
  '2026-10-18-retirement-sim-design.md',
  '2026-10-18-retirement-sim.md',
  '2026-10-18-retirement-sim-design-review-request.md',
  '2026-10-18-retirement-sim-design-review-decisions.md',
])
  files.push(resolve(project, 'plan', name));
const hashes = {};
for (const p of files) hashes[relative(project, p)] = hash(await readFile(p));
let npm = 'unavailable';
try {
  npm = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim();
} catch {}
const manifest = {
  record_kind:
    'Current evidence content hashes (project has no Git repository); original M00 reports preserved',
  created_at: new Date().toISOString(),
  environment: {
    node: process.version,
    npm,
    os: platform() + ' ' + release(),
    cpu: cpus()[0]?.model,
    total_memory_bytes: totalmem(),
    browser: 'See records/browser-results.json',
    app_node: '24.22.0 pinned in package.json and .node-version',
  },
  spec_source_status: 'unverified',
  schema_version: 1,
  rng_version: 'retire-rng-v1',
  draw_version: 'retire-draws-v3',
  layout_version: layout.version,
  model_build: 'See records/release.json',
  human_acceptance: 'RETIRED',
  sha256: hashes,
};
await writeFile(
  resolve(root, 'records/evidence-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(JSON.stringify(report.counts, null, 2));
for (const c of checks.filter((c) => c.status === 'FAIL'))
  console.error(c.name, JSON.stringify(c.detail));
if (report.counts.fail) process.exitCode = 1;
