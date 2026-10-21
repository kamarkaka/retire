import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { cpus, totalmem, release } from 'node:os';
import { execFileSync } from 'node:child_process';
import { BUILD_SOURCE_SHA256, BUILD_VERSION } from '../src/build-info';
import { recordMilestones } from './record-milestones';
import { RETIRED_CASE_IDS } from '../src/verification/cases';
import { references } from '../src/reference/bundle';
const paths = {
  unit: 'verification/records/unit-results.json',
  numeric: 'verification/records/product-cases.json',
  browser: 'verification/records/browser-results.json',
  build: 'verification/records/build-results.json',
  data: 'verification/records/M03/data-report.json',
  inventory: 'verification/records/inventory-integrity.json',
  reference: 'verification/records/reference-arithmetic.json',
  dependencies: 'verification/records/dependency-audit.json',
  performance: 'verification/records/e2e/chromium-performance.json',
};
const records: Record<string, any> = {},
  hashes: Record<string, string> = {};
for (const [key, path] of Object.entries(paths)) {
  const bytes = await readFile(path);
  records[key] = JSON.parse(bytes.toString());
  hashes[path] = createHash('sha256').update(bytes).digest('hex');
}
const issues: string[] = [];
const oracle = JSON.parse(
  await readFile('verification/fixtures/oracles.json', 'utf8'),
) as { cases: { id: string; oracle_kind: string }[] };
const supportedNumeric = oracle.cases.filter(
  (c) => c.oracle_kind === 'numeric' && !RETIRED_CASE_IDS.includes(c.id),
);
if (
  records.unit.numFailedTests !== 0 ||
  records.unit.numPendingTests !== 0 ||
  !records.unit.success
)
  issues.push('Unit suite has a failed/pending test');
if (
  records.numeric.counts.FAIL !== 0 ||
  records.numeric.counts.PASS !== supportedNumeric.length ||
  records.numeric.counts.RETIRED !== RETIRED_CASE_IDS.length
)
  issues.push(
    `Supported numeric case suite did not pass all ${supportedNumeric.length} applicable independent oracles`,
  );
if (
  records.browser.stats.unexpected !== 0 ||
  records.browser.stats.skipped !== 0 ||
  records.browser.stats.expected < 24
)
  issues.push('Complete production browser suite did not pass');
if (
  records.build.status !== 'PASS' ||
  records.build.build_source_sha256 !== BUILD_SOURCE_SHA256
)
  issues.push('Build verification is stale or failed');
if (
  records.inventory.counts.fail !== 0 ||
  !records.data.status.startsWith('PASS') ||
  records.performance.status !== 'PASS'
)
  issues.push('Inventory/data/performance report failed');
if (
  !records.data.raw_historical_source_status.startsWith('CHECKED') ||
  records.data.hashes.history !== references.hashes.history ||
  records.data.versions.history !== references.versions.history
)
  issues.push('Observed historical source report is missing/stale');
if (
  records.reference.counts.reference_fail !== 0 ||
  records.dependencies.metadata.vulnerabilities.total !== 0
)
  issues.push('Independent reference or dependency audit failed');
const perfRows = records.performance.rows as {
  paths: number;
  ui_wall_ms: number;
}[];
if (
  perfRows.length !== 6 ||
  perfRows.some((r) => r.ui_wall_ms >= (r.paths === 2000 ? 10000 : 90000))
)
  issues.push('Six warm-run performance gates did not pass');
const status = issues.length
  ? 'FAIL'
  : 'PASS: supported example workflow with observed NYU/FRED references';
const verifiedAt = new Date(
  Date.parse(records.browser.stats.startTime) + records.browser.stats.duration,
).toISOString();
const report = {
  status,
  created_at: new Date().toISOString(),
  verified_at: verifiedAt,
  version: BUILD_VERSION,
  build_source_sha256: BUILD_SOURCE_SHA256,
  environment: {
    node: process.version,
    npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
    os: process.platform + ' ' + release(),
    cpu: cpus()[0]?.model,
    total_memory_bytes: totalmem(),
  },
  results: {
    unit_pass: records.unit.numPassedTests,
    numeric: records.numeric.counts,
    browser: records.browser.stats,
    build: records.build.status,
    build_checks: records.build.checks.length,
    data: records.data.status,
    inventory: records.inventory.counts,
  },
  performance: records.performance,
  manual_acceptance: 'RETIRED',
  open: [
    'Broader empirical Monte Carlo calibration targets; raw NYU/FRED data and calendar dot-com/2008/2022 replays are checked',
    'Broader primary legal-source audit; scoped §1250 worksheet evidence is checked',
    'Actual household classifications, account bases/access, property cash/tax inputs and medical scope',
    'Resident-alien income-tax branch for retained-green-card B',
    'Safari/WebKit and ordinary browser child-process launch acceptance on this host',
  ],
  issues,
  evidence_sha256: hashes,
};
if (!issues.length) {
  await recordMilestones({ ...report, created_at: verifiedAt });
  // Include the newly generated step records in the final content-hash manifest.
  // The manifest excludes itself and release.json, so this has no hash cycle.
  try {
    execFileSync(
      process.execPath,
      ['verification/reference/check-artifacts.mjs'],
      { encoding: 'utf8' },
    );
  } catch (error) {
    issues.push('Final milestone evidence integrity failed: ' + String(error));
  }
  const inventoryBytes = await readFile(paths.inventory);
  records.inventory = JSON.parse(inventoryBytes.toString());
  report.results.inventory = records.inventory.counts;
  hashes[paths.inventory] = createHash('sha256')
    .update(inventoryBytes)
    .digest('hex');
  if (records.inventory.counts.fail !== 0 && !issues.length)
    issues.push('Final inventory has failed checks');
  const manifestPath = 'verification/records/evidence-manifest.json';
  hashes[manifestPath] = createHash('sha256')
    .update(await readFile(manifestPath))
    .digest('hex');
}
report.status = issues.length ? 'FAIL' : status;
await writeFile(
  'verification/records/release.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      status: report.status,
      version: BUILD_VERSION,
      unit_pass: report.results.unit_pass,
      numeric: report.results.numeric,
      browser: report.results.browser,
      issues,
    },
    null,
    2,
  ),
);
if (issues.length) process.exitCode = 1;
