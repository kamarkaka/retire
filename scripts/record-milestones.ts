import { readFile, writeFile, mkdir } from 'node:fs/promises';

type Step = {
  status: 'PASS' | 'PARTIAL' | 'OPEN';
  scope: string;
  code: string[];
  evidence?: string[];
};
const steps: Record<string, Step> = {
  'M00.1': {
    status: 'PASS',
    scope:
      'Current 87-field contract includes fixed-by-asset income treatment and plain-English help, records net-worth stopping and immutable public-market packages, and preserves the 53-field core layout and frozen M00 oracles.',
    code: [
      'verification/contracts.d.ts',
      'verification/config-fields.json',
      'verification/result-layout.json',
    ],
  },
  'M00.2': {
    status: 'PASS',
    scope:
      'All55 frozen arithmetic answers remain unchanged;18 product cases pass,6 broad cases stay OPEN and38 superseded cases are RETIRED. MARKET-TIMING excludes removed deposit-rate/FX-event subfields. PV controls use explicit test-only reference rows.',
    code: [
      'verification/market-tapes.ts',
      'verification/fixtures/oracles.json',
      'verification/reference/recalculate.mjs',
    ],
    evidence: ['reference-arithmetic.json', 'product-cases.json'],
  },
  'M01.1': {
    status: 'PARTIAL',
    scope:
      'Fresh npm ci, pinned Node24, strict typecheck and static production build pass. Chromium fallback passes; Safari/ordinary child-process launch acceptance remains OPEN.',
    code: ['package.json', 'package-lock.json', 'vite.config.ts'],
    evidence: [
      'build-results.json',
      'browser-results.json',
      'dependency-audit.json',
    ],
  },
  'M01.2': {
    status: 'PASS',
    scope:
      'Real product case runner, structured inputs/actual/expected/trace reports and dev-only harness. Unknown/unimplemented source cases cannot pass; fixture payload excluded from production.',
    code: [
      'scripts/verify-case.ts',
      'src/verification/Harness.tsx',
      'src/verification/cases.ts',
    ],
    evidence: [
      'product-cases.json',
      'e2e/chromium-dev-harness.json',
      'build-results.json',
    ],
  },
  'M01.3': {
    status: 'PARTIAL',
    scope:
      'Native worker probe returns [1,2,3], sender detaches; production transfers, directory mount and offline fresh workers pass in Chromium. Safari remains OPEN.',
    code: ['src/workers/probe.ts', 'src/workers/pool.ts'],
    evidence: [
      'e2e/chromium-dev-harness.json',
      'e2e/chromium-scheduling.json',
      'e2e/chromium-static-hosting.json',
    ],
  },
  'M02.1': {
    status: 'PASS',
    scope:
      'Strict staged TOML import, normalized defaults and runnable gates. Legacy and versionless uploads are rejected with no migration path.',
    code: [
      'src/config/schema.ts',
      'src/config/config.ts',
      'tests/accounts.test.ts',
    ],
    evidence: [
      'unit-results.json',
      'browser-results.json',
      'e2e/chromium-simplified-accounts.json',
    ],
  },
  'M02.2': {
    status: 'PASS',
    scope:
      'All 77 metadata fields have editors and plain-English help, including conditional fields/list cells, except fixed account identities and concise allocation cells. Medical fields live in the Budget section. Hover/focus/click/Escape/mobile bounds and focused wheel blocking preserve numeric/text/select edits. Fixed accounts need no income settings; holdings and separate profiles are removed. Existing market/Medical controls and required-input gates remain; Social Security inputs are removed.',
    code: [
      'src/components/Builder.tsx',
      'src/components/ConfigField.tsx',
      'src/components/NumberInput.tsx',
      'src/config/fields.json',
      'src/config/constructors.ts',
      'verification/reference/field-help.mjs',
    ],
    evidence: [
      'unit-results.json',
      'inventory-integrity.json',
      'browser-results.json',
      'e2e/chromium-configuration-help.json',
      'e2e/chromium-decimal-wheel.json',
      'e2e/chromium-simplified-accounts.json',
      'e2e/chromium-unified-configurations.json',
      'e2e/chromium-random-seed.json',
      'e2e/chromium-decimal-rates.json',
      'e2e/chromium-fixed-horizon.json',
    ],
  },
  'M02.3': {
    status: 'PASS',
    scope:
      'Local File.text/Blob downloads preserve UTF-8, immutable exports and reload equivalence. Current files carry no holding declarations; legacy uploads are rejected and the existing draft is preserved. No browser storage or configuration request.',
    code: ['src/App.tsx', 'src/config/downloads.ts'],
    evidence: [
      'e2e/chromium-sample-reimport.json',
      'e2e/chromium-edited-draft.toml',
      'e2e/chromium-simplified-accounts.json',
      'browser-results.json',
    ],
  },
  'M03.1': {
    status: 'PASS',
    scope:
      'Repeatable shared JS collector fetches all five fixed public sources. Frozen98 US years/39 China years/45 FX years and both income yields match independent stdlib raw readers; homepage live gateway applies validated source-backed inputs.',
    code: [
      'scripts/market-data-source.ts',
      'scripts/fetch-market-data.ts',
      'scripts/market-data-gateway.ts',
      'scripts/verify-data.ts',
      'verification/reference/check-refresh-source.py',
    ],
    evidence: ['M03/data-report.json', 'e2e/chromium-market-refresh-live.json'],
  },
  'M03.2': {
    status: 'PASS',
    scope:
      'Observed US population statistics and China/FX calibration agree with independent arithmetic. Source stock dividend fraction and latest Treasury par-yield proxy are checked without adding yield to total return.',
    code: [
      'src/reference/calibration.ts',
      'src/reference/fred.ts',
      'tests/market-data.test.ts',
    ],
    evidence: ['M03/data-report.json', 'unit-results.json'],
  },
  'M03.3': {
    status: 'PARTIAL',
    scope:
      'Frozen static reference hashes/versions and common input validation pass. Source verification remains a separate status for every configuration; only actual input/combination validation controls Run.',
    code: [
      'src/reference/bundle.ts',
      'src/reference/source-gates.json',
      'src/config/config.ts',
    ],
    evidence: ['M03/data-report.json', 'browser-results.json'],
  },
  'M04.1': {
    status: 'PASS',
    scope:
      'SHA-256 tuple seeding, xoshiro128**, little-endian state, open uniforms and fixed Box-Muller conventions match independent vectors.',
    code: ['src/model/rng.ts', 'src/model/canonical.ts'],
  },
  'M04.2': {
    status: 'PASS',
    scope:
      'Joint stationary bootstrap uses source rows unchanged for every config. Custom/affine/geometric-retarget logic is removed; finite total/post-yield domain checks remain.',
    code: [
      'src/model/market.ts',
      'src/reference/calibration.ts',
      'tests/historical-data.test.ts',
    ],
    evidence: ['product-cases.json', 'unit-results.json'],
  },
  'M04.3': {
    status: 'PASS',
    scope:
      'China AR CPI and FX drift/PPP/noise use S[0..T] and opening/ending indices; FX stress events and CNY interest are removed. Original applicable timing answers and legacy-field invariance pass.',
    code: ['src/model/market.ts', 'tests/market-data.test.ts'],
    evidence: ['product-cases.json', 'unit-results.json'],
  },
  'M04.4': {
    status: 'PARTIAL',
    scope:
      'Indexed full-horizon draws and spending-independent prefix/schedule stability pass. Observed population/compound calibration passes; broader empirical Monte Carlo distribution targets remain OPEN.',
    code: [
      'src/model/rng.ts',
      'src/model/market.ts',
      'src/reference/calibration.ts',
    ],
    evidence: ['e2e/chromium-scheduling.json', 'unit-results.json'],
  },
  'M05.1': {
    status: 'PASS',
    scope:
      'Budget annual minus included health supplies ordinary spending. The single aggregate health base is counted once; every budget uses initial treatment and there is no budget mode. Recurring/flex rules are removed; one-time scopes remain.',
    code: ['src/model/consumption.ts', 'src/model/preview.ts'],
  },
  'M05.2': {
    status: 'PASS',
    scope:
      'Medical price/age growth, two-person shocks and care from selected start age through final horizon pass. Care is always additional; no care end age/scope or per-person base exists. These tests do not calibrate clinical risk.',
    code: ['src/model/consumption.ts', 'src/model/rng.ts'],
  },
  'M05.3': {
    status: 'PASS',
    scope:
      'Social Security inputs are removed and no benefits are ever paid. Both people stay alive; survivor rules are retired. Legacy values are discarded on import.',
    code: ['src/model/consumption.ts', 'src/model/engine.ts'],
  },
  'M05.4': {
    status: 'PASS',
    scope:
      'Fixed-by-asset income treatment retains tax classification without adding yield to total return. Access, basis, reinvestment, rebalancing, attribution, RMD and FX funding pass independent journals. Cash account types are retired; CNY cash ledger columns stay zero.',
    code: [
      'src/model/accounts.ts',
      'src/model/engine.ts',
      'tests/accounts.test.ts',
    ],
    evidence: [
      'product-cases.json',
      'unit-results.json',
      'e2e/chromium-simplified-accounts.json',
    ],
  },
  'M06.1': {
    status: 'PARTIAL',
    scope:
      'Supported resident tax/netting, annual loss deduction/carry and early penalty pass. Property gains use LTCG rates; the Section1250 25% bucket is intentionally not modeled and its former scoped evidence is archived; the broader audit remains OPEN.',
    code: ['src/model/tax.ts'],
    evidence: [
      'product-cases.json',
      'unit-results.json',
      'e2e/chromium-property-gain-regression.json',
    ],
  },
  'M06.2': {
    status: 'PARTIAL',
    scope:
      'Declared citizen/resident and noncitizen/nonresident income-tax routing pass. Resident-alien income-tax branch and broad primary-source acceptance remain OPEN. No estate-domicile/tax transition exists.',
    code: ['src/model/tax.ts', 'src/config/config.ts'],
  },
  'M06.3': {
    status: 'PARTIAL',
    scope:
      'Same-year China credit against eligible US-paid tax passes with pension exclusion. Legal expiry/refund/FX policies remain OPEN and are labeled example assumptions.',
    code: ['src/model/tax.ts', 'src/model/engine.ts'],
  },
  'M06.4': {
    status: 'OPEN',
    scope:
      'The current 15-row registry keeps whole-rule acceptance unverified; the Section1250 worksheet subset is intentionally not modeled and its former scoped evidence is archived. The original 18-row M00 registry stays archived. No verification checkbox controls Run; the broad audit is OPEN.',
    code: [
      'src/reference/source-gates.json',
      'verification/source-gates.json',
      'src/config/config.ts',
    ],
    evidence: ['M03/data-report.json', 'browser-results.json'],
  },
  'M07.1': {
    status: 'PASS',
    scope:
      'Rental cash/ScheduleE, mortgage, depreciation, owner USD/CNY bases and property-state journals reconcile to independent arithmetic.',
    code: ['src/model/property.ts', 'src/model/engine.ts'],
  },
  'M07.2': {
    status: 'PASS',
    scope:
      'Feasible closing cash/contributions, sale failure and same-year ECI tax pass. Section 1231 loss history and lookback ordering are removed.',
    code: ['src/model/property.ts', 'src/model/engine.ts'],
  },
  'M07.3': {
    status: 'PASS',
    scope:
      'Both people retain their alive status and account/property ownership through the inclusive younger-Max-age horizon. There are no transfers, basis step-ups or estate events; leftover unpaid income tax is a terminal memo deduction.',
    code: ['src/model/engine.ts'],
  },
  'M08.1': {
    status: 'PASS',
    scope:
      'The same year engine reproduces independent50-payment PV/FX controls with test-only literal rows. Solvent paths reach younger Max age; zero/negative net assets stop earlier, including before cash flows for an empty initial portfolio.',
    code: [
      'src/model/engine.ts',
      'verification/market-tapes.ts',
      'tests/stopping.test.ts',
    ],
    evidence: [
      'product-cases.json',
      'unit-results.json',
      'e2e/chromium-net-asset-stop.json',
    ],
  },
  'M08.2': {
    status: 'PASS',
    scope:
      'Financial years stop at nonpositive net worth; positive property equity can sustain simulation after a liquidity shortfall. Same-year closing taxes are paid, leftover tax is a terminal memo, and future expenses/returns/tax years do not execute.',
    code: ['src/model/engine.ts', 'tests/stopping.test.ts'],
    evidence: ['unit-results.json', 'e2e/chromium-net-asset-stop.json'],
  },
  'M08.3': {
    status: 'PASS',
    scope:
      'Real engine fixtures yield same-year paid tax with sub-dollar leftover (491382.02 heirs), a quiet second year, and ECI 7582.50 paid with 232417.50 heirs. No tax stub, artificial final cash remittance or hidden timing balance.',
    code: ['src/model/engine.ts'],
    evidence: ['unit-results.json'],
  },
  'M09.1': {
    status: 'PASS',
    scope:
      'Bounded four-worker/64-path chunks, indexed assembly, transfers and off-main-thread aggregation pass actual production workers.',
    code: [
      'src/workers/pool.ts',
      'src/workers/simulate.worker.ts',
      'src/workers/analysis.worker.ts',
    ],
    evidence: [
      'e2e/chromium-scheduling.json',
      'e2e/chromium-ui-and-analysis-cancel.json',
    ],
  },
  'M09.2': {
    status: 'PASS',
    scope:
      'Type7 quantiles, whole-N fixed-lifetime cohorts, separate funding/ending-income-tax/budget metrics, stable ranking and Float64 scalar summaries pass. Legacy estate/flex/death output slots have compatibility meanings only.',
    code: ['src/model/results.ts', 'src/model/layout.ts'],
  },
  'M09.3': {
    status: 'PARTIAL',
    scope:
      'One/four workers with delayed out-of-order chunks match all 1,000 compact paths exactly; 2000-path prefix and full replay paths 0/17/999 match. Cross-browser goldens remain OPEN.',
    code: [
      'src/model/canonical.ts',
      'src/model/results.ts',
      'src/workers/pool.ts',
    ],
    evidence: [
      'e2e/chromium-scheduling.json',
      'e2e/chromium-sample-reimport.json',
    ],
  },
  'M09.4': {
    status: 'PASS',
    scope:
      'Five cancel/restarts release workers, delayed old replies cannot replace a new run, summarizing cancellation discards results, and a later invalid CPI path fails all 4,000 requested paths.',
    code: ['src/workers/pool.ts', 'src/App.tsx'],
    evidence: [
      'e2e/chromium-failure-and-cleanup.json',
      'e2e/chromium-ui-and-analysis-cancel.json',
    ],
  },
  'M10.1': {
    status: 'PASS',
    scope:
      'Validated run controls, previews, common validation, source status and immutable labels are connected to the engine. Paths/Seed and the TOML editor share accessible plain-English help; numeric controls block wheel stepping.',
    code: [
      'src/App.tsx',
      'src/components/ConfigField.tsx',
      'src/components/NumberInput.tsx',
      'src/components/Assumptions.tsx',
      'src/model/preview.ts',
    ],
    evidence: [
      'browser-results.json',
      'e2e/chromium-configuration-help.json',
      'e2e/chromium-decimal-wheel.json',
      'e2e/chromium-after-analysis-cancel.json',
    ],
  },
  'M10.2': {
    status: 'PASS',
    scope:
      'Worker wealth percentiles retain whole-cohort denominators and use zero after exhausted paths stop, avoiding survivor-only bands. Market bands remain unconditional over T; liabilities/funding/excess stay separate.',
    code: [
      'src/model/results.ts',
      'src/components/Results.tsx',
      'tests/stopping.test.ts',
    ],
    evidence: [
      'unit-results.json',
      'browser-results.json',
      'e2e/chromium-net-asset-stop.json',
    ],
  },
  'M10.3': {
    status: 'PASS',
    scope:
      'Full-precision replay uses completed-run references, not refreshed global data. Integer ledger money and58-column CSV show only simulated years and stop metadata; original/pinned ledgers are byte-identical after refresh; data+TOML reproduce a run after reload.',
    code: [
      'src/components/Ledger.tsx',
      'src/workers/pool.ts',
      'src/config/downloads.ts',
    ],
    evidence: [
      'browser-results.json',
      'e2e/chromium-market-refresh-snapshots.json',
      'e2e/chromium-net-asset-stop.json',
    ],
  },
  'M10.4': {
    status: 'PASS',
    scope:
      'Current/run/baseline TOML, full-precision 58-column CSV and scientific manifests download locally; reload/re-upload reproduces scientific inputs and all aggregates.',
    code: ['src/config/downloads.ts', 'src/App.tsx'],
    evidence: [
      'e2e/chromium-sample-reimport.json',
      'e2e/chromium-sample-path17.csv',
      'browser-results.json',
    ],
  },
  'M11.1': {
    status: 'PARTIAL',
    scope:
      'Gross household facts and missing-field gates are preserved. PV/FX/medical controls and observed 40/60 compound calibration pass; the verified after-tax household forecast still needs facts and tax support.',
    code: [
      'src/config/constructors.ts',
      'src/reference/calibration.ts',
      'src/model/engine.ts',
    ],
  },
  'M11.2': {
    status: 'PASS',
    scope:
      'Actual year loop reproduces the frozen two-year sequence and loss carryovers. Observed 2000–2002, 2008 and 2022 calendar tapes reproduce independent 40/60 Treasury balances, with and without beginning-year withdrawals.',
    code: [
      'src/model/engine.ts',
      'src/model/tax.ts',
      'src/verification/cases.ts',
      'tests/historical-data.test.ts',
    ],
    evidence: [
      'M11/historical-dotcom.json',
      'M11/historical-gfc.json',
      'M11/historical-stocks_and_bonds_down.json',
      'product-cases.json',
    ],
  },
  'M11.3': {
    status: 'PARTIAL',
    scope:
      'Six genuine T52 warm runs meet 10s/90s gates, retain37.42MB, measure full-browser RSS and reject an oversized100k/T71 run plus baseline without changing N. The ordinary sample is T70. Safari performance remains OPEN; allocation guard is not an OS memory cap.',
    code: ['src/workers/pool.ts', 'tests/e2e/performance.spec.ts'],
    evidence: [
      'e2e/chromium-performance.json',
      'e2e/chromium-ui-and-analysis-cancel.json',
    ],
  },
  'M11.4': {
    status: 'PARTIAL',
    scope:
      'Chromium covers static directory mounts, explicit public-data GET refresh, package import/export, failure/cancel preservation and offline fresh run/replay without config requests or storage. The public gateway has no user configuration input. Safari remains OPEN.',
    code: [
      'scripts/market-data-gateway.ts',
      'tests/e2e/market-data.spec.ts',
      'src/config/downloads.ts',
    ],
    evidence: [
      'e2e/chromium-market-refresh-live.json',
      'e2e/chromium-market-refresh-errors.json',
      'e2e/chromium-static-hosting.json',
      'e2e/chromium-offline-manifest.json',
      'browser-results.json',
    ],
  },
  'M11.5': {
    status: 'PARTIAL',
    scope:
      'Supported observed-reference example release passes all automated checks, with usage and all 42 step records. Full household/legal/empirical-calibration/Safari acceptance remains OPEN; all external release gates are recorded.',
    code: [
      'README.md',
      'scripts/release-report.ts',
      'scripts/record-milestones.ts',
    ],
    evidence: ['release.json', 'browser-results.json', 'build-results.json'],
  },
};

export async function recordMilestones(report: {
  status: string;
  version: string;
  created_at: string;
  results: {
    unit_pass: number;
    numeric: unknown;
    browser: unknown;
    build_checks: number;
  };
  performance: {
    rows: {
      paths: number;
      ui_wall_ms: number;
      peak_rss_bytes: number | null;
    }[];
  };
}) {
  if (!report.status.startsWith('PASS'))
    throw new Error('Cannot record milestone acceptance from a failed release');
  const plan = await readFile('plan/2026-10-18-retirement-sim.md', 'utf8'),
    titles = [...plan.matchAll(/^#### (M\d{2}\.\d) — (.+)$/gm)].map((m) => ({
      id: m[1],
      title: m[2],
    }));
  if (
    titles.length !== 42 ||
    Object.keys(steps).length !== 42 ||
    titles.some((t) => !steps[t.id])
  )
    throw new Error('Every original 42 step ID must be recorded');
  const product = JSON.parse(
    await readFile('verification/records/product-cases.json', 'utf8'),
  ) as { cases: { id: string; step: string; status: string }[] };
  const numeric = report.results.numeric as Record<string, number>,
    browser = report.results.browser as { expected: number };
  const rows: string[] = [];
  for (const { id, title } of titles) {
    const step = steps[id],
      directory = id.replace('.', '-'),
      name = id.startsWith('M00') ? 'automated.md' : 'notes.md',
      path = `verification/records/${directory}/${name}`,
      cases = product.cases.filter((c) => c.step === id);
    await mkdir(`verification/records/${directory}`, { recursive: true });
    const evidence = step.evidence ?? [
      'product-cases.json',
      'unit-results.json',
    ];
    await writeFile(
      path,
      `# ${id} — ${title}\n\n- Status: **${step.status}** for the scope below.\n- Recorded: ${report.created_at}\n- Build: ${report.version}\n- Human/manual sign-off: RETIRED.\n\n## Scope and result\n\n${step.scope}\n\n## Implementation\n\n${step.code.map((p) => `- [${p}](../../../${p})`).join('\n')}\n\n## Automated evidence\n\n${evidence.map((p) => `- [${p}](../${p})`).join('\n')}\n${cases.length ? '\nCase results: ' + cases.map((c) => `${c.id}: ${c.status}`).join('; ') + '.\n' : ''}\nNumeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.\n`,
    );
    rows.push(
      `| ${id} | ${step.status} | [${title}](records/${directory}/${name}) | ${step.scope} |`,
    );
  }
  const performance = [2000, 20000].map((n) => {
    const times = report.performance.rows
      .filter((r) => r.paths === n)
      .map((r) => r.ui_wall_ms)
      .sort((a, b) => a - b);
    return `| ${n.toLocaleString()} | ${(times[1] / 1000).toFixed(3)} s | ${(Math.max(...times) / 1000).toFixed(3)} s |`;
  });
  const peak = Math.max(
    ...report.performance.rows.map((r) => r.peak_rss_bytes ?? 0),
  );
  await writeFile(
    'verification/implementation-status.md',
    `# Automated implementation status\n\nRecorded ${report.created_at}. Build **${report.version}**. Implementation followed the original M00–M11 dependency order; all 42 step IDs are below. Human checklists/signatures are retired.\n\n**Supported sample workflow: PASS.** ${report.results.unit_pass} unit/integration tests, ${numeric.PASS} applicable independent numeric product cases (${numeric.RETIRED} retired), ${browser.expected} production Chromium browser tests, 28 inventory checks and ${report.results.build_checks} static-build checks pass. ${numeric.OPEN} broad source/data numeric cases remain OPEN; ${numeric.SUITE} structural cases are labeled SUITE by the numeric CLI and exercised separately. Counts overlap rather than adding to one total.\n\nThe app supports browser upload/build/edit → workers → charts → pin/compare → full-precision ledger/download → reload/re-upload. [Start/run instructions](../README.md), [sample TOML](../examples/sample.toml) and [release record](records/release.json).\n\n## Milestone gates\n\nPASS applies to the recorded supported arithmetic/Chromium example scope. PARTIAL includes the stated OPEN acceptance requirement; it does not mean a blocked household forecast passed.\n\n| Milestone | Gate | Scope |\n|---|---|---|\n| M00 | PASS | Independent contracts/oracles and current integrity/reference checks |\n| M01 | PARTIAL | Static/dev/worker foundation passes Chromium; Safari/ordinary child-process launch OPEN |\n| M02 | PASS | Portable local configuration/builder/round trip and household gating |\n| M03 | PARTIAL | Observed NYU/FRED rows and population calibration pass; broad legal registry OPEN |\n| M04 | PARTIAL | RNG/observed-market mechanics pass; broader empirical Monte Carlo targets OPEN |\n| M05 | PASS | Supported spending/medical/benefit/account arithmetic |\n| M06 | PARTIAL | Supported simplified tax arithmetic; primary rules/resident branch OPEN |\n| M07 | PASS | Property cash/closing and fixed ownership pass |\n| M08 | PASS | Actual year loop and exact financial controls |\n| M09 | PARTIAL | Worker/index/transfer/cancel/replay pass; cross-browser goldens OPEN |\n| M10 | PASS | Complete supported sample UI, comparison, ledger and exports |\n| M11 | PARTIAL | Chromium performance/privacy/software release pass; full source/household/Safari acceptance OPEN |\n\n## All 42 steps\n\n| Step | Status | Record | Verified scope / remaining requirement |\n|---|---|---|---|\n${rows.join('\n')}\n\n## Measured performance\n\nProduction Chromium, four real workers, explicit 52-year benchmark, 1-path warmup, three genuine runs per size, no tracing/result cache. Exact hardware/browser/configuration hashes are in the performance record; the ordinary sample has 70 years.\n\n| Paths | Median Run-to-KPI time | Maximum |\n|---|---|---|\n${performance.join('\n')}\n\n20,000 paths over 52 years retain 32,300,000 bytes, including 29,120,000 chart bytes. Full-browser RSS peaked at ${(peak / 1e9).toFixed(3)} GB, sampled every 200ms; it includes browser overhead and worker heaps. The 512MiB preflight budgets modeled allocations plus a reserve, not an OS process cap. Requested 100,000 paths over 75 years with a 32.30MB baseline needs 517.2MiB of modeled allocations and is rejected before spawning workers, with N unchanged. [Full measurements/method](records/e2e/chromium-performance.json).\n\n## Actual household readiness: BLOCKED\n\n- B’s retained green card and US income-tax residency; required resident-alien branch is not implemented.\n- Fixed three accounts, brokerage basis and pre-tax access; confirm per-household values.\n- Property rent, bases/depreciation, operating costs, mortgage terms and transaction assumptions.\n- Single included 38,000 CNY medical base, commercial insurance, growth/shocks/care; care is always additional.\n- China residence/domicile policy and applicable primary rules. Social Security is excluded from the simulation.\n- Observed NYU/FRED inputs and calendar 2000–2002/2008/2022 replays pass; broader empirical Monte Carlo targets remain OPEN.\n\nMissing required inputs and unsupported tax branches block every configuration. Source verification is reported separately and does not change calculations or Run eligibility. All five Simulation metadata fields and their gates are removed; recognized legacy values are rejected on import. Simulation exposes only start year, path count, seed and maximum age, with synchronized Random seed buttons. Everyone stays alive through the younger Max age (or the person's, when alone). Budget supplies ordinary spending and the single aggregate medical base; Medical supplies shocks and continuing always-additional care. Social Security is excluded: no benefits are ever paid. Cash account types are retired; CNY spending converts from USD. Decimal input text is preserved; ledger money displays integers while calculations/CSV remain full precision. The household constructor preserves $5.3M gross financial assets, property $2M/loans $731k, ages 40, FX 6.69, 250k CNY with 38k included health, and hold/last-resort-sale=false; it uses referenced tax rates, not control overrides. Examples use observed US history; empty overrides retain historical returns and do not impose a 3% target. China/FX paths still use configured parameters.\n\n## Browser and evidence limits\n\nChromium runs with a single-process workaround because this host denies child-process Mach-port registration. Real UI/workers/transfers/downloads are tested. WebKit/ordinary browser-process launch fails before app load; no Safari PASS is claimed. [Browser results](records/browser-results.json), [current source gates](../src/reference/source-gates.json), [independent M00 archive](records/M00/acceptance.md).\n`,
  );
}
