import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  runProductCase,
  compareActual,
  RETIRED_CASE_IDS,
  retiredCaseReason,
  type VerificationCase,
} from '../src/verification/cases';
import { references } from '../src/reference/bundle';
import { hashObject, hashText } from '../src/model/canonical';
const args = process.argv.slice(2);
const oracle = JSON.parse(
  await readFile('verification/fixtures/oracles.json', 'utf8'),
);
const id = args[args.indexOf('--case') + 1];
if (args.includes('--list')) {
  console.log(
    oracle.cases
      .map(
        (c: VerificationCase) =>
          `${c.id}\t${c.step}\t${RETIRED_CASE_IDS.includes(c.id) ? 'RETIRED' : c.oracle_kind === 'numeric' ? 'PRODUCT ADAPTER' : c.oracle_kind === 'conditional' ? 'OPEN: SOURCE/DATA' : 'AUTOMATED SUITE'}`,
      )
      .join('\n'),
  );
} else {
  const selected: VerificationCase[] = args.includes('--all')
    ? oracle.cases
    : oracle.cases.filter((c: { id: string }) => c.id === id);
  if (!selected.length)
    throw new Error(`Unknown case: ${id || '(missing --case)'}`);
  const cases = selected.map((c) => {
    if (RETIRED_CASE_IDS.includes(c.id))
      return {
        id: c.id,
        step: c.step,
        status: 'RETIRED',
        reason:
          retiredCaseReason(c.id) + ' Original independent oracle preserved.',
      };
    if (c.oracle_kind === 'conditional')
      return {
        id: c.id,
        step: c.step,
        status: 'OPEN',
        reason:
          'The complete original source/data gate remains open; later scoped evidence is recorded in the source registry and unit/browser reports.',
        source_gate_ids: c.source_gate_ids,
      };
    if (c.oracle_kind === 'structural')
      return {
        id: c.id,
        step: c.step,
        status: 'SUITE',
        evidence:
          'npm test and npm run test:e2e; see current recorded suite output. This CLI does not claim a browser assertion has run.',
      };
    try {
      const product = runProductCase(c),
        failures = compareActual(
          c.expected,
          product.actual,
          c.tolerance,
          product.excluded_expected_fields,
        );
      return {
        id: c.id,
        step: c.step,
        status: failures.length ? 'FAIL' : 'PASS',
        inputs: c.inputs,
        expected: c.expected,
        actual: product.actual,
        trace: product.trace,
        excluded_expected_fields: product.excluded_expected_fields,
        failures,
        tolerance: c.tolerance,
        legal_status: c.legal_status,
        source_gate_ids: c.source_gate_ids,
      };
    } catch (e) {
      return {
        id: c.id,
        step: c.step,
        status: 'FAIL',
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });
  const counts = Object.fromEntries(
    ['PASS', 'FAIL', 'OPEN', 'SUITE', 'RETIRED'].map((status) => [
      status,
      cases.filter((c) => c.status === status).length,
    ]),
  );
  const report = {
    kind: 'Product numeric oracle execution; structural acceptance is recorded separately',
    node: process.version,
    generated_at: new Date().toISOString(),
    oracle_sha256: hashText(
      await readFile('verification/fixtures/oracles.json', 'utf8'),
    ),
    reference_versions: references.versions,
    reference_hashes: references.hashes,
    counts,
    cases,
    legal_status: 'OPEN; arithmetic does not verify sources',
  };
  const path = args.includes('--report')
    ? args[args.indexOf('--report') + 1]
    : 'verification/records/product-cases.json';
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(report, null, 2) + '\n');
  console.log(
    cases
      .map((c) => `${c.status}\t${c.id}${'error' in c ? '\t' + c.error : ''}`)
      .join('\n'),
  );
  console.log(
    JSON.stringify(
      { counts, report: path, report_sha256: hashObject(report) },
      null,
      2,
    ),
  );
  for (const c of cases.filter((c) => c.status === 'FAIL'))
    console.error(JSON.stringify(c, null, 2));
  if (counts.FAIL > 0) process.exitCode = 1;
}
