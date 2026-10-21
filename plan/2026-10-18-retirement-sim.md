# Retirement Simulator: Implementation Plan

- **Date:** 2026-10-18
- **Spec:** [Current design](2026-10-18-retirement-sim-design.md).
- **Status:** The app is implemented in the original M00–M11 dependency order. All 42 step IDs are preserved below; human sign-offs are retired by user instruction. [Current records](../verification/implementation-status.md) distinguish PASS, PARTIAL and OPEN acceptance.
- **Stack/delivery:** React + TypeScript + Vite, pure browser calculation engine, module workers and ECharts, plus an explicit read-only public-data gateway for manual NYU/FRED refresh. Upload/build/edit/download TOML locally; no server-side configuration files or simulation/configuration API.

## 1. Implementation and acceptance rules

1. Preserve all original milestones/step IDs and implement dependent financial integration only after applicable arithmetic passes.
2. Each step below has concrete implementation files, executable automated verification, an expected result and evidence. No manual checklist, user signature or permission gate remains.
3. Keep original M00 inputs/oracles/source notes immutable. Retire obsolete mortality/estate/survivor/recurring/flex cases explicitly; do not regenerate expected answers from product code. Independent source worksheets/literal calculations are separate from actual product results.
4. All configurations share required-input/combination validation. Actual missing facts and unsupported resident-alien/worksheet branches block Run. Broad legal/data source status is reported independently; observed-reference example acceptance never certifies the household forecast.
5. Current common calculation rules: both alive with financial paths ending at younger Max age or nonpositive net worth, one Budget medical base, ordinary annual budget, continuing always-additional care, no Social Security benefits, zero CNY-deposit interest and three market groups. Income treatment is fixed by asset with no holding settings. Every input has plain-English help; precise decimal inputs cannot be changed by the mouse wheel. UI money is integer display; decisions/scalars/CSV remain full precision.
6. Record actual build/configuration/reference/version hashes, environment, inputs/actual/expected/traces and PASS/FAIL. Whole-job invalid factors/cancellation/stale messages cannot produce partial statistics.

### Verification conventions

Run commands below from the project root. Browser checks require a current production build and installed Chromium. `npm run check` performs prerequisites and all gates in order. Focused commands reuse the build/reference artifacts; run `npm run build` before testing changed app code.

Money comparisons use their independent case tolerance (normally0.01); integer states/counts are exact. Numerical funding residuals at most1e-6 are zero. Scalar quantiles and paired differences use Float64 Type7; chart buffers are Float32.

The original catalog has80 cases (55 numeric,7 conditional,18 structural). Current product comparison has39 applicable numeric cases and23 RETIRED; MARKET-TIMING explicitly excludes removed deposit-rate and FX-event subfields. Six broad conditional cases remain OPEN; structural numeric labels are SUITE and have separate unit/browser evidence. The checked IRS capital subset has additional independent source cases.

### Milestone dependencies

| Milestone | Deliverable | Dependencies |
|---|---|---|
| M00 | Current contracts and independent artifacts | Spec |
| M01 | App/build/harness/workers | M00 |
| M02 | Portable configuration and builder | M01 |
| M03 | Public reference bundle/calibration | M00–M02 |
| M04 | Indexed RNG/market paths | M03 |
| M05 | Budget/medical/own benefits/accounts | M02, M04 |
| M06 | Supported income taxes/settlements | M03, M05 |
| M07 | Property/closing/fixed ownership | M05–M06 |
| M08 | Full year loop | M04–M07 |
| M09 | Workers/summaries/replay | M08 |
| M10 | Complete browser results/exports | M02, M09 |
| M11 | Crisis/resource/privacy/release checks | M00–M10 |

## 2. Milestones

### M00 — Freeze current contracts and independent verification inputs

#### M00.1 — Translate the spec into model and configuration contracts

**Implementation:** `verification/contracts.d.ts`, `verification/config-fields.json`, `verification/result-layout.json`.

**Automated verification:**

```sh
npm run verify:reference
npm run typecheck
npm run verify:inventory
```

**Expected / acceptance:** Current 190-field contract includes fixed-by-asset income treatment and plain-English help, removes Custom/FX stress, records net-worth stopping and immutable public-market packages, and preserves the 54-field core layout and frozen M00 oracles.

Current inventory is 190 fields. Keep the frozen 54-field core order and all original independent expected answers. Current input changes must not rewrite historical M00 reports.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M00-1/automated.md`.

#### M00.2 — Prepare independently calculated fixture oracles

**Implementation:** `verification/fixtures/oracles.json`, `verification/reference/recalculate.mjs`.

**Automated verification:**

```sh
npm run verify:reference
npm run verify -- --all
```

**Expected / acceptance:** All55 frozen arithmetic answers remain unchanged;33 product cases pass,6 broad cases stay OPEN and23 superseded cases are RETIRED. MARKET-TIMING excludes removed deposit-rate/FX-event subfields. PV controls use explicit test-only reference rows.

The flat-FX literal PV is USD2,390,572.9770677146; the appreciation PV is USD3,152,520.3411145047. Original reference arithmetic is55 cases; product scope is39 applicable,23 RETIRED, 6 OPEN and 18 SUITE. MARKET-TIMING explicitly excludes its retired deposit-rate and FX-stress subfields.

**Evidence:** [reference-arithmetic.json](../verification/records/reference-arithmetic.json), [product-cases.json](../verification/records/product-cases.json). Per-step record: `verification/records/M00-2/automated.md`.

### M01 — Establish the JavaScript app and verification harness

#### M01.1 — Create a reproducible React/TypeScript/Vite project

**Implementation:** `package.json`, `package-lock.json`, `vite.config.ts`.

**Automated verification:**

```sh
npm run typecheck
npm run build
npm run verify:build
```

**Expected / acceptance:** Fresh npm ci, pinned Node24, strict typecheck and static production build pass. Chromium fallback passes; Safari/ordinary child-process launch acceptance remains OPEN.

**Evidence:** [build-results.json](../verification/records/build-results.json), [browser-results.json](../verification/records/browser-results.json), [dependency-audit.json](../verification/records/dependency-audit.json). Per-step record: `verification/records/M01-1/notes.md`.

#### M01.2 — Add the development harness and structured case reports

**Implementation:** `scripts/verify-case.ts`, `src/verification/Harness.tsx`, `src/verification/cases.ts`.

**Automated verification:**

```sh
npm run verify -- --all
npm run test:e2e -- --grep 'development-only'
```

**Expected / acceptance:** Real product case runner, structured inputs/actual/expected/trace reports and dev-only harness. Unknown/unimplemented source cases cannot pass; fixture payload excluded from production.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [e2e/chromium-dev-harness.json](../verification/records/e2e/chromium-dev-harness.json), [build-results.json](../verification/records/build-results.json). Per-step record: `verification/records/M01-2/notes.md`.

#### M01.3 — Prove worker loading and transfer ownership early

**Implementation:** `src/workers/probe.ts`, `src/workers/pool.ts`.

**Automated verification:**

```sh
npm run test:e2e -- --grep 'development-only|M09: one/four'
```

**Expected / acceptance:** Native worker probe returns [1,2,3], sender detaches; production transfers, directory mount and offline fresh workers pass in Chromium. Safari remains OPEN.

**Evidence:** [e2e/chromium-dev-harness.json](../verification/records/e2e/chromium-dev-harness.json), [e2e/chromium-scheduling.json](../verification/records/e2e/chromium-scheduling.json), [e2e/chromium-static-hosting.json](../verification/records/e2e/chromium-static-hosting.json). Per-step record: `verification/records/M01-3/notes.md`.

### M02 — Implement client-owned configuration and the complete builder

#### M02.1 — Implement strict TOML parsing, normalization and draft gates

**Implementation:** `src/config/schema.ts`, `src/config/config.ts`.

**Automated verification:**

```sh
npm test -- tests/config.test.ts tests/accounts.test.ts
```

**Expected / acceptance:** Strict staged TOML import, known keys/version/finite/integer checks, normalized defaults and runnable gates. Every configuration uses the bundled reference tables; legacy and versionless uploads are rejected with no migration path.

**Evidence:** [unit-results.json](../verification/records/unit-results.json), [browser-results.json](../verification/records/browser-results.json). Per-step record: `verification/records/M02-1/notes.md`.

#### M02.2 — Build every configuration section and its references

**Implementation:** `src/components/Builder.tsx`, `src/components/ConfigField.tsx`, `src/components/NumberInput.tsx`, `src/config/fields.json`, `src/config/constructors.ts`, `verification/reference/field-help.mjs`.

**Automated verification:**

```sh
npm run verify:inventory
npm run test:e2e -- --grep 'M02'
```

**Expected / acceptance:** All 190 current metadata fields have editors and plain-English help, including conditional controls/list cells. Medical fields live in the Budget section. Hover/focus/tap, Escape and viewport placement work. Focused numeric inputs ignore wheel stepping without losing focus or decimal/keyboard edits. New brokerage and Cash USD accounts need no income settings; holdings and Holding profiles are absent. Three market groups, descriptive sex and care remain. Social Security inputs are removed. Required household facts still block Run.

The browser checks actual sequential typing of 0.003 in stock/bond yields, signed decimal entry, external configuration synchronization, three market groups, sample A1986/F and B1986/M (household domicile China), removed Social Security inputs, omitted recurring/People-medical/care-end/care-scope/CNY-interest fields and the explanatory CNY-cash note.

`tests/e2e/configuration.spec.ts` additionally checks label/help associations against all 228 leaf definitions, hover/focus/click/Escape/mobile popup bounds, actual mouse-wheel gestures on signed rates/allocation/bracket cells, and account creation/run/download/reload. Legacy shared-profile uploads reproduce the same manifest, aggregates and ledger. The other two metadata entries are loss-history list containers.

**Evidence:** [help coverage](../verification/records/e2e/chromium-configuration-help.json), [wheel checks](../verification/records/e2e/chromium-decimal-wheel.json), [simplified accounts round trip](../verification/records/e2e/chromium-simplified-accounts.json), [unit-results.json](../verification/records/unit-results.json), [inventory-integrity.json](../verification/records/inventory-integrity.json), [browser-results.json](../verification/records/browser-results.json), [e2e/chromium-unified-configurations.json](../verification/records/e2e/chromium-unified-configurations.json), [e2e/chromium-random-seed.json](../verification/records/e2e/chromium-random-seed.json), [e2e/chromium-decimal-rates.json](../verification/records/e2e/chromium-decimal-rates.json), [e2e/chromium-fixed-horizon.json](../verification/records/e2e/chromium-fixed-horizon.json). Per-step record: `verification/records/M02-2/notes.md`.

#### M02.3 — Finish local upload/download and round-trip equivalence

**Implementation:** `src/App.tsx`, `src/config/downloads.ts`.

**Automated verification:**

```sh
npm run test:e2e -- --grep 'sample builder|invalid upload'
```

**Expected / acceptance:** Local File.text/Blob download flow, UTF-8 preservation, immutable completed exports and reload/re-upload equivalence. New files contain no holding declarations; valid legacy uploads with dropped holdings produce identical current scientific inputs/aggregates/ledger. No browser storage or configuration request.

**Evidence:** [e2e/chromium-sample-reimport.json](../verification/records/e2e/chromium-sample-reimport.json), [e2e/chromium-edited-draft.toml](../verification/records/e2e/chromium-edited-draft.toml), [browser-results.json](../verification/records/browser-results.json). Per-step record: `verification/records/M02-3/notes.md`.

### M03 — Bundle public references and reproduce calibration

#### M03.1 — Import verified source rows using Node tooling

**Implementation:** `scripts/import-data.ts`, `scripts/market-data-source.ts`, `scripts/fetch-market-data.ts`, `scripts/market-data-gateway.ts`, `tests/import-data.test.ts`, `tests/market-data.test.ts`.

**Automated verification:**

```sh
npm test -- tests/import-data.test.ts tests/market-data.test.ts
npm run data:verify
```

**Expected / acceptance:** Repeatable shared JS collector fetches all five fixed public sources. Frozen98 US years/39 China years/45 FX years and both income yields match independent stdlib raw readers; homepage live gateway applies validated source-backed inputs.

Synthetic BIFF fixtures test parser rejection. The frozen NYU/FRED inputs and independent raw-source receipts verify the actual observed rows; `data:bundle` activates only checked values.

**Evidence:** [M03/importer-test.json](../verification/records/M03/importer-test.json). Per-step record: `verification/records/M03-1/notes.md`.

#### M03.2 — Calculate population moments and freeze reference versions

**Implementation:** `src/reference/calibration.ts`, `src/reference/bundle.ts`.

**Automated verification:**

```sh
npm test -- tests/market.test.ts
npm run data:verify
```

**Expected / acceptance:** Observed US population statistics and China/FX calibration agree with independent arithmetic. Source stock dividend fraction and latest Treasury par-yield proxy are checked without adding yield to total return.

**Evidence:** [M03/data-report.json](../verification/records/M03/data-report.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M03-2/notes.md`.

#### M03.3 — Load references in the static app and enforce source gates

**Implementation:** `src/reference/bundle.ts`, `src/reference/source-gates.json`, `src/config/config.ts`.

**Automated verification:**

```sh
npm run data:verify
npm run verify:build
```

**Expected / acceptance:** Frozen static reference hashes/versions and common input validation pass. Source verification remains a separate status for every configuration; only actual input/combination validation controls Run.

**Evidence:** [M03/data-report.json](../verification/records/M03/data-report.json), [browser-results.json](../verification/records/browser-results.json). Per-step record: `verification/records/M03-3/notes.md`.

### M04 — Implement deterministic streams and market generation

#### M04.1 — Freeze PRNG seeding, output and draw-consumption conventions

**Implementation:** `src/model/rng.ts`, `src/model/canonical.ts`.

**Automated verification:**

```sh
npm test -- tests/market.test.ts
npm run verify -- --case RNG-VECTORS
```

**Expected / acceptance:** SHA-256 tuple seeding, xoshiro128**, little-endian state, open uniforms and fixed Box-Muller conventions match independent vectors.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M04-1/notes.md`.

#### M04.2 — Implement bootstrap using unchanged historical rows

**Implementation:** `src/model/market.ts`, `src/reference/calibration.ts`.

**Automated verification:**

```sh
npm test -- tests/market.test.ts tests/historical-data.test.ts tests/market-data.test.ts
npm run verify -- --case MARKET-JOINT
```

**Expected / acceptance:** Joint stationary bootstrap uses source rows unchanged for every config. Custom/affine/geometric-retarget logic is removed; finite total/post-yield domain checks remain.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M04-2/notes.md`.

#### M04.3 — Implement China CPI, FX, indices and derived growth

**Implementation:** `src/model/market.ts`.

**Automated verification:**

```sh
npm run verify -- --case MARKET-TIMING
npm run verify -- --case MARKET-AR
npm test -- tests/engine.test.ts
```

**Expected / acceptance:** China AR CPI and FX drift/PPP/noise use S[0..T] and opening/ending indices; FX stress events and CNY interest are removed. Original applicable timing answers and legacy-field invariance pass.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M04-3/notes.md`.

#### M04.4 — Prove stable indexed streams and stochastic calibration

**Implementation:** `src/model/rng.ts`, `src/model/market.ts`, `src/reference/calibration.ts`.

**Automated verification:**

```sh
npm test -- tests/market.test.ts
npm run test:e2e -- --grep 'M09: one/four'
npm run data:verify
```

**Expected / acceptance:** Indexed full-horizon draws and spending-independent prefix/schedule stability pass. Observed population/compound calibration passes; broader empirical Monte Carlo distribution targets remain OPEN.

**Evidence:** [e2e/chromium-scheduling.json](../verification/records/e2e/chromium-scheduling.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M04-4/notes.md`.

### M05 — Implement budget, medical, benefits and financial accounts

#### M05.1 — Implement single-source budget spending and one-time costs

**Implementation:** `src/model/consumption.ts`, `src/model/preview.ts`.

**Automated verification:**

```sh
npm test -- tests/consumption.test.ts
npm run verify -- --case MEDICAL-GROWTH
```

**Expected / acceptance:** Budget annual minus included health supplies ordinary spending. The single aggregate health base is counted once; every budget uses initial treatment and there is no budget mode. Recurring/flex rules are removed; one-time scopes remain.

At t0, ordinary212k + aggregate health38k =250k exactly once. The annual ordinary base is annual_cny minus included_health_cny. One-time expenses remain; recurring lists and flex logic do not.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M05-1/notes.md`.

#### M05.2 — Implement aggregate medical growth, shocks and continuing additional care

**Implementation:** `src/model/consumption.ts`, `src/model/rng.ts`.

**Automated verification:**

```sh
npm test -- tests/consumption.test.ts
npm run verify -- --case MEDICAL-SCOPE
```

**Expected / acceptance:** Medical price/age growth, per-person shocks and care from selected start age through final horizon pass. Care is always additional; no care end age/scope or per-person base exists. These tests do not calibrate clinical risk.

A literal monthly1000 care case adds12,000 CNY/year, leaves the included250,000 ceiling unchanged and reports12,000 additional. At a6% medical price factor it grows to12,720 then13,483.20 and continues to the horizon. There is no care end age/scope. Base is the single Budget amount; shocks remain per person.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M05-2/notes.md`.

#### M05.3 — Remove own Social Security

**Implementation:** `src/model/consumption.ts`, `src/model/engine.ts`.

**Automated verification:**

```sh
npm test -- tests/consumption.test.ts tests/config.test.ts
npm run test:e2e -- --grep 'fixed younger-age|decimal rate'
```

**Expected / acceptance:** Social Security inputs are removed and no benefits are ever paid. Everyone stays alive; survivor rules are retired.

No configuration carries Social Security inputs; legacy values are discarded on import. Benefit amounts are always zero in every row. The income-tax treatment of Social Security benefits remains in the tax code for frozen-oracle compatibility but always operates on zero.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M05-3/notes.md`.

#### M05.4 — Implement account journals, access, RMD and FX funding

**Implementation:** `src/model/accounts.ts`, `src/model/engine.ts`.

**Automated verification:**

```sh
npm test -- tests/consumption.test.ts tests/engine.test.ts
npm run verify -- --case ACCOUNT-BASIS
```

**Expected / acceptance:** Access, average basis, reinvestment, rebalancing, owner attribution, RMD and bidirectional FX funding pass independent journals. Cash CNY produces zero interest/taxable income/return despite inflation and FX changes.

The CNY-only literal100,000 account stays100,000 nominal through two years, produces no interest/income/return, and ends at100,000/(1.04^2) real CNY while FX changes. Cash CNY still funds withdrawals and retains its return-report weight.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M05-4/notes.md`.

### M06 — Implement supported income-tax arithmetic and settlements

#### M06.1 — Implement resident capital netting and income tax

**Implementation:** `src/model/tax.ts`, `verification/sources/irs-schedule-d-2025.md`, `verification/sources/irs-schedule-d-2025.json`.

**Automated verification:**

```sh
npm test -- tests/tax.test.ts
npm run verify -- --case US-CARRY
npm run test:e2e -- --grep 'property-sale/securities-loss'
```

**Expected / acceptance:** Supported resident tax/netting, annual loss deduction/carry and early penalty pass. Partial positive all-long-term Section1250 ordering uses checked 2025 IRS worksheets and independent carryover cases; the broader audit remains OPEN.

Read the original IRS PDF/hash/worksheet/cases in verification/sources/irs-schedule-d-2025.*. Six source cases include current LT losses and prior carries; integrated resident/NRA results and the shipped-example sale/loss browser reproduction are separate checks. Do not label the broader CAPITAL-PARTIAL conditional scope verified. PROPERTY-1231 is retired with Section 1231 removal.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json), [e2e/chromium-section1250-regression.json](../verification/records/e2e/chromium-section1250-regression.json). Per-step record: `verification/records/M06-1/notes.md`.

#### M06.2 — Implement NRA and citizen income-tax profile routing

**Implementation:** `src/model/tax.ts`, `src/config/config.ts`.

**Automated verification:**

```sh
npm run verify -- --case NRA-1
npm test -- tests/config.test.ts tests/tax.test.ts
```

**Expected / acceptance:** Declared citizen/resident and noncitizen/nonresident income-tax routing pass. Resident-alien income-tax branch and broad primary-source acceptance remain OPEN. No estate-domicile/tax transition exists.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M06-2/notes.md`.

#### M06.3 — Implement China tax, eligible payments and vintage FTC

**Implementation:** `src/model/tax.ts`, `src/model/settlements.ts`, `src/model/engine.ts`.

**Automated verification:**

```sh
npm test -- tests/tax.test.ts tests/engine.test.ts
npm run verify -- --case CN-PARTIAL
```

**Expected / acceptance:** Eligible substantiated retained payments, partial remittances, country limits and annual FTC accounting pass. Legal expiry/refund/FX policies remain OPEN and are labeled example assumptions.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M06-3/notes.md`.

#### M06.4 — Audit primary sources and report source status

**Implementation:** `src/reference/source-gates.json`, `verification/source-gates.json`, `src/config/config.ts`.

**Automated verification:**

```sh
npm test -- tests/tax.test.ts
npm run data:verify
```

**Expected / acceptance:** The current 15-row registry keeps whole-rule acceptance unverified, with scoped 2025 IRS capital worksheet evidence recorded separately. The original 18-row M00 registry stays archived. No verification checkbox controls Run; the broad audit is OPEN.

The current15-row registry contains scoped capital evidence but all whole-rule statuses remain unverified. The original18-row registry is historical. No config verification flag can bypass missing inputs or unsupported branches.

**Evidence:** [M03/data-report.json](../verification/records/M03/data-report.json), [browser-results.json](../verification/records/browser-results.json). Per-step record: `verification/records/M06-4/notes.md`.

### M07 — Implement properties, sale liquidity and fixed ownership

#### M07.1 — Implement property cash/basis/mortgage journals

**Implementation:** `src/model/property.ts`, `src/model/engine.ts`.

**Automated verification:**

```sh
npm test -- tests/engine.test.ts
npm run verify -- --case PROPERTY-BOOKS
npm run verify -- --case PROPERTY-MORTGAGE
```

**Expected / acceptance:** Rental cash/ScheduleE, mortgage, depreciation, owner USD/CNY bases and property-state journals reconcile to independent arithmetic.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M07-1/notes.md`.

#### M07.2 — Implement feasible sales with citizen treatment and hold restriction

**Implementation:** `src/model/property.ts`, `src/model/engine.ts`, `src/model/settlements.ts`.

**Automated verification:**

```sh
npm run verify -- --case FIRPTA-SHARE
npm run verify -- --case SALE-FAIL
npm run test:e2e -- --grep 'property-sale/securities-loss'
```

**Expected / acceptance:** Feasible closing cash/contributions, holding restriction and sale failure pass with no withholding. Section 1231 loss history and lookback ordering are removed, and FIRPTA cases are retired.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M07-2/notes.md`.

#### M07.3 — Preserve fixed ownership and ending income-tax settlement

**Implementation:** `src/model/engine.ts`, `src/model/settlements.ts`.

**Automated verification:**

```sh
npm test -- tests/engine.test.ts
npm run test:e2e -- --grep 'fixed younger-age'
```

**Expected / acceptance:** Everyone retains their alive status and account/property ownership through the inclusive younger-Max-age horizon (or the single Max-age horizon). There are no transfers, basis step-ups or estate events; ending unpaid income taxes/confirmed refunds remain reconciled.

For A61/B59 and Max62, exactly four rows end at A64/B62, alive flags1/1 and estate tax0. Owners/bases have no death transfer or step-up; normal property depreciation still applies.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M07-3/notes.md`.

### M08 — Integrate the deterministic financial year loop

#### M08.1 — Implement the ten-phase loop and exact 50-payment control

**Implementation:** `src/model/engine.ts`.

**Automated verification:**

```sh
npm run verify -- --case CONTROL-PV
npm run verify -- --case CONTROL-FX
npm run test:e2e -- --grep '50-year control'
```

**Expected / acceptance:** The same year engine reproduces independent50-payment PV/FX controls with test-only literal rows. Solvent paths reach younger Max age; zero/negative net assets stop earlier, including before cash flows for an empty initial portfolio.

Start2026/birth1986/Max89 makes50 beginning-year payments with both alive. An extended horizon has an additional payment only if net worth stays positive; the old post-exhaustion fixture is RETIRED. Exact-PV residuals do not trigger depletion.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [e2e/chromium-control.csv](../verification/records/e2e/chromium-control.csv), [e2e/chromium-control-manifest.json](../verification/records/e2e/chromium-control-manifest.json). Per-step record: `verification/records/M08-1/notes.md`.

#### M08.2 — Verify access, FX and nonpositive-net-worth stopping

**Implementation:** `src/model/engine.ts`, `src/model/accounts.ts`.

**Automated verification:**

```sh
npm test -- tests/engine.test.ts tests/stopping.test.ts
```

**Expected / acceptance:** Financial years stop at nonpositive net worth; positive property equity can sustain simulation after a liquidity shortfall. Early/final closing taxes/refunds are retained, and future expenses/returns/tax years do not execute.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M08-2/notes.md`.

#### M08.3 — Verify final bills, prior bills, refunds and payment order

**Implementation:** `src/model/engine.ts`, `src/model/settlements.ts`.

**Automated verification:**

```sh
npm run verify -- --case ENGINE-FINAL-TAX
npm run verify -- --case ENGINE-PRIOR-TAX
npm run verify -- --case ENGINE-FIRPTA
```

**Expected / acceptance:** Real engine fixtures yield 500k assets minus24734 unpaid tax=475266 ending after-tax assets, prior tax funded from pre-tax accounts=474402.6, and citizen-sale 240k cash minus7582.5 final tax=232417.5. No tax stub, artificial final cash remittance or hidden initial settlement. The original flat-rate oracles are retired; unit tests pin the bundled-rate mechanics.

The literal final-tax500k−24734=475266, prior pre-tax-funded tax474402.6, and citizen-sale 232417.5 checks use real engine taxes. Ending memorandum values do not create a fictitious final cash payment.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M08-3/notes.md`.

### M09 — Add workers, summaries and scheduling-independent results

#### M09.1 — Execute bounded path chunks and aggregate off the main thread

**Implementation:** `src/workers/pool.ts`, `src/workers/simulate.worker.ts`, `src/workers/analysis.worker.ts`.

**Automated verification:**

```sh
npm run test:e2e -- --grep 'M09: one/four'
```

**Expected / acceptance:** Bounded four-worker/64-path chunks, indexed assembly, transfers and off-main-thread aggregation pass actual production workers.

**Evidence:** [e2e/chromium-scheduling.json](../verification/records/e2e/chromium-scheduling.json), [e2e/chromium-ui-and-analysis-cancel.json](../verification/records/e2e/chromium-ui-and-analysis-cancel.json). Per-step record: `verification/records/M09-1/notes.md`.

#### M09.2 — Implement quantiles, fixed cohorts, rankings and scalar KPIs

**Implementation:** `src/model/results.ts`, `src/model/layout.ts`.

**Automated verification:**

```sh
npm test -- tests/results.test.ts tests/comparison.test.ts
npm run verify -- --case RANKING-1
```

**Expected / acceptance:** Type7 quantiles, whole-N fixed-lifetime cohorts, separate funding/ending-income-tax/budget metrics, stable ranking and Float64 scalar summaries pass. Legacy estate/flex/death output slots have compatibility meanings only.

All N paths remain in every yearly cohort. Integer money display does not determine quantiles: scalars/deltas are Float64 and chart bands are Float32. Legacy flex/estate/death buffers retain constant/compatibility values only.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M09-2/notes.md`.

#### M09.3 — Verify reproducibility, prefix stability and immutable replay

**Implementation:** `src/model/canonical.ts`, `src/model/results.ts`, `src/workers/pool.ts`.

**Automated verification:**

```sh
npm run test:e2e -- --grep 'M09: one/four|sample builder'
```

**Expected / acceptance:** One/four workers with delayed out-of-order chunks match all 1,000 compact paths exactly; 2000-path prefix and full replay paths 0/17/999 match. Cross-browser goldens remain OPEN.

**Evidence:** [e2e/chromium-scheduling.json](../verification/records/e2e/chromium-scheduling.json), [e2e/chromium-sample-reimport.json](../verification/records/e2e/chromium-sample-reimport.json). Per-step record: `verification/records/M09-3/notes.md`.

#### M09.4 — Implement cancel, full-run failure and stale-message protection

**Implementation:** `src/workers/pool.ts`, `src/App.tsx`.

**Automated verification:**

```sh
npm run test:e2e -- --grep 'responsive draft|later invalid|cancel/discard'
```

**Expected / acceptance:** Five cancel/restarts release workers, delayed old replies cannot replace a new run, summarizing cancellation discards results, and a later invalid CPI path fails all 4,000 requested paths.

**Evidence:** [e2e/chromium-failure-and-cleanup.json](../verification/records/e2e/chromium-failure-and-cleanup.json), [e2e/chromium-ui-and-analysis-cancel.json](../verification/records/e2e/chromium-ui-and-analysis-cancel.json). Per-step record: `verification/records/M09-4/notes.md`.

### M10 — Complete results, ledger, comparison and local exports

#### M10.1 — Connect run controls, validation and financial previews

**Implementation:** `src/App.tsx`, `src/components/Assumptions.tsx`, `src/model/preview.ts`.

**Automated verification:**

```sh
npm run test:e2e -- --grep 'sample builder|random seed|decimal rate'
```

**Expected / acceptance:** Validated run controls, budget/market previews, active counts, common input validation and source status and immutable configuration labels are connected to the engine.

**Evidence:** [browser-results.json](../verification/records/browser-results.json), [e2e/chromium-after-analysis-cancel.json](../verification/records/e2e/chromium-after-analysis-cancel.json). Per-step record: `verification/records/M10-1/notes.md`.

#### M10.2 — Add charts and reconcile labels/metrics

**Implementation:** `src/components/Results.tsx`, `src/components/Chart.tsx`, `src/model/results.ts`.

**Automated verification:**

```sh
npm run test:e2e -- --grep 'sample builder'
```

**Expected / acceptance:** Worker wealth percentiles retain whole-cohort denominators and use zero after exhausted paths stop, avoiding survivor-only bands. Market bands remain unconditional over T; liabilities/funding/excess stay separate.

**Evidence:** [e2e/chromium-results.png](../verification/records/e2e/chromium-results.png), [browser-results.json](../verification/records/browser-results.json). Per-step record: `verification/records/M10-2/notes.md`.

#### M10.3 — Add full-precision ledger/provenance and immutable comparison

**Implementation:** `src/components/Ledger.tsx`, `src/components/Compare.tsx`, `src/model/comparison.ts`.

**Automated verification:**

```sh
npm run test:e2e -- --grep 'fixed younger-age|50-year control|matched-path'
```

**Expected / acceptance:** Full-precision replay uses completed-run references, not refreshed global data. Integer ledger money and58-column CSV show only simulated years and stop metadata; original/pinned ledgers are byte-identical after refresh; data+TOML reproduce a run after reload.

Replay medical provenance must reconcile base + shocks + continuing care; additional consumption includes care, included consumption excludes it. Every ledger monetary cell is integer text; CSV/provenance still contain raw precision and annual return is a percent in the UI.

**Evidence:** [e2e/chromium-comparison-oracle.json](../verification/records/e2e/chromium-comparison-oracle.json), [e2e/chromium-baseline-path17.csv](../verification/records/e2e/chromium-baseline-path17.csv). Per-step record: `verification/records/M10-3/notes.md`.

#### M10.4 — Complete config/run/ledger downloads and end-to-end round trip

**Implementation:** `src/config/downloads.ts`, `src/App.tsx`.

**Automated verification:**

```sh
npm run test:e2e -- --grep 'sample builder|matched-path'
```

**Expected / acceptance:** Current/run/baseline TOML, full-precision 58-column CSV and scientific manifests download locally; reload/re-upload reproduces scientific inputs and all aggregates.

**Evidence:** [e2e/chromium-sample-reimport.json](../verification/records/e2e/chromium-sample-reimport.json), [e2e/chromium-sample-path17.csv](../verification/records/e2e/chromium-sample-path17.csv), [browser-results.json](../verification/records/browser-results.json). Per-step record: `verification/records/M10-4/notes.md`.

### M11 — Verify scenarios, resources, privacy and release readiness

#### M11.1 — Reconcile household facts, PV controls and observed compound returns

**Implementation:** `src/config/constructors.ts`, `src/reference/calibration.ts`, `src/model/engine.ts`.

**Automated verification:**

```sh
npm test -- tests/market.test.ts tests/consumption.test.ts tests/config.test.ts
npm run verify -- --case CONTROL-PV
```

**Expected / acceptance:** Gross household facts and missing-field gates are preserved. PV/FX/medical controls and observed 40/60 compound calibration pass; the verified after-tax household forecast still needs facts and tax support.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M11-1/notes.md`.

#### M11.2 — Replay dot-com/2008 annual losses and sequence effects

**Implementation:** `src/model/engine.ts`, `src/model/tax.ts`, `src/verification/cases.ts`.

**Automated verification:**

```sh
npm run verify -- --case SEQUENCE-1
npm run verify -- --case CRISIS-DOTCOM
npm run verify -- --case CRISIS-2008
npm run data:verify
```

**Expected / acceptance:** Actual year loop reproduces the frozen two-year sequence and loss carryovers. Observed 2000–2002, 2008 and 2022 calendar tapes reproduce independent 40/60 Treasury balances, with and without beginning-year withdrawals.

The frozen two-year sequence remains 77,500/82,000 with withdrawals and 100,000 without them. Additional observed dot-com/2008/2022 calendar tapes are checked against independent annual 40/60 Treasury balances; diversified returns use the source calendar rows.

**Evidence:** [product-cases.json](../verification/records/product-cases.json), [unit-results.json](../verification/records/unit-results.json). Per-step record: `verification/records/M11-2/notes.md`.

#### M11.3 — Measure production performance, memory and cancellation

**Implementation:** `src/workers/pool.ts`, `tests/e2e/performance.spec.ts`.

**Automated verification:**

```sh
npm run test:e2e -- tests/e2e/performance.spec.ts
```

**Expected / acceptance:** Six genuine T52 warm runs meet 10s/90s gates, retain37.42MB, measure full-browser RSS and reject an oversized100k/T71 run plus baseline without changing N. The ordinary sample is T70. Safari performance remains OPEN; allocation guard is not an OS memory cap.

The performance fixture explicitly sets Max92 for sample start ages41, giving T52. The ordinary sample is T70. Measure six genuine runs, full-browser RSS and retained bytes separately; test oversized100k/T71 plus pinned result without changing N. No Safari result is inferred.

**Evidence:** [e2e/chromium-performance.json](../verification/records/e2e/chromium-performance.json), [e2e/chromium-ui-and-analysis-cancel.json](../verification/records/e2e/chromium-ui-and-analysis-cancel.json). Per-step record: `verification/records/M11-3/notes.md`.

#### M11.4 — Verify static hosting, local files and offline computation

**Implementation:** `src/config/downloads.ts`, `src/workers/pool.ts`, `scripts/verify-build.ts`.

**Automated verification:**

```sh
npm run verify:build
npm run test:e2e -- --grep 'subdirectory|cancel/discard'
```

**Expected / acceptance:** Chromium covers static directory mounts, explicit public-data GET refresh, package import/export, failure/cancel preservation and offline fresh run/replay without config requests or storage. The public gateway has no user configuration input. Safari remains OPEN.

**Evidence:** [e2e/chromium-static-hosting.json](../verification/records/e2e/chromium-static-hosting.json), [e2e/chromium-offline-manifest.json](../verification/records/e2e/chromium-offline-manifest.json), [build-results.json](../verification/records/build-results.json), [browser-results.json](../verification/records/browser-results.json). Per-step record: `verification/records/M11-4/notes.md`.

#### M11.5 — Perform the final automated acceptance and report open gates

**Implementation:** `README.md`, `scripts/release-report.ts`, `scripts/record-milestones.ts`.

**Automated verification:**

```sh
npm run check
```

**Expected / acceptance:** Supported observed-reference example release passes all automated checks, with usage and all 42 step records. Full household/legal/empirical-calibration/Safari acceptance remains OPEN; all external release gates are recorded.

Release acceptance requires all 133 current unit tests, all 39 applicable independent numeric comparisons and all 28 Chromium workflows (including input help, wheel blocking, simplified accounts, sample taxes, care, decimal entry, five-source live refresh, immutable reference replay and early/zero-year stops), plus data/build/inventory checks. Counts and evidence hashes are generated from actual reports. OPEN/RETIRED/SUITE do not become PASS.

**Evidence:** [release.json](../verification/records/release.json), [browser-results.json](../verification/records/browser-results.json), [build-results.json](../verification/records/build-results.json). Per-step record: `verification/records/M11-5/notes.md`.

## 3. Completion and handoff

`npm run check` writes fresh unit, reference, data, numeric, production-build, browser, inventory and release evidence, then records all42 steps. Release is PASS only for the supported example workflow with observed NYU/FRED references. Broader primary legal rules, retained-green-card household readiness, empirical Monte Carlo calibration targets and Safari/ordinary process-launch acceptance remain explicitly OPEN. Raw NYU/FRED fidelity, population calibration and calendar dot-com/2008/2022 replays are checked.

Review [usage](../README.md), [sample TOML](../examples/sample.toml), [current implementation status](../verification/implementation-status.md), [release report](../verification/records/release.json), [source evidence](../verification/sources/irs-schedule-d-2025.md) and [household inputs](../verification/household-gates.md). Original M00 reports/manual preparation notes and the prior plan remain archival evidence; no manual process is reinstated.
