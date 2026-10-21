# Automated implementation status

Recorded 2026-10-20T11:36:03.928Z. Build **0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027**. Implementation followed the original M00–M11 dependency order; all 42 step IDs are below. Human checklists/signatures are retired.

**Supported sample workflow: PASS.** 133 unit/integration tests, 33 applicable independent numeric product cases (23 retired), 28 production Chromium browser tests, 27 inventory checks and 20 static-build checks pass. 6 broad source/data numeric cases remain OPEN; 18 structural cases are labeled SUITE by the numeric CLI and exercised separately. Counts overlap rather than adding to one total.

The app supports browser upload/build/edit → workers → charts → pin/compare → full-precision ledger/download → reload/re-upload. [Start/run instructions](../README.md), [sample TOML](../examples/sample.toml) and [release record](records/release.json).

## Milestone gates

PASS applies to the recorded supported arithmetic/Chromium example scope. PARTIAL includes the stated OPEN acceptance requirement; it does not mean a blocked household forecast passed.

| Milestone | Gate | Scope |
|---|---|---|
| M00 | PASS | Independent contracts/oracles and current integrity/reference checks |
| M01 | PARTIAL | Static/dev/worker foundation passes Chromium; Safari/ordinary child-process launch OPEN |
| M02 | PASS | Portable local configuration/builder/round trip and household gating |
| M03 | PARTIAL | Observed NYU/FRED rows and population calibration pass; broad legal registry OPEN |
| M04 | PARTIAL | RNG/observed-market mechanics pass; broader empirical Monte Carlo targets OPEN |
| M05 | PASS | Supported spending/medical/benefit/account arithmetic |
| M06 | PARTIAL | Supported tax/settlement arithmetic; primary rules/resident branch/worksheets OPEN |
| M07 | PASS | Property cash/closing and fixed ownership pass |
| M08 | PASS | Actual year loop and exact financial controls |
| M09 | PARTIAL | Worker/index/transfer/cancel/replay pass; cross-browser goldens OPEN |
| M10 | PASS | Complete supported sample UI, comparison, ledger and exports |
| M11 | PARTIAL | Chromium performance/privacy/software release pass; full source/household/Safari acceptance OPEN |

## All 42 steps

| Step | Status | Record | Verified scope / remaining requirement |
|---|---|---|---|
| M00.1 | PASS | [Translate the spec into model and configuration contracts](records/M00-1/automated.md) | Current 190-field contract includes fixed-by-asset income treatment and plain-English help, records net-worth stopping and immutable public-market packages, and preserves the 54-field core layout and frozen M00 oracles. |
| M00.2 | PASS | [Prepare independently calculated fixture oracles](records/M00-2/automated.md) | All55 frozen arithmetic answers remain unchanged;33 product cases pass,6 broad cases stay OPEN and23 superseded cases are RETIRED. MARKET-TIMING excludes removed deposit-rate/FX-event subfields. PV controls use explicit test-only reference rows. |
| M01.1 | PARTIAL | [Create a reproducible React/TypeScript/Vite project](records/M01-1/notes.md) | Fresh npm ci, pinned Node24, strict typecheck and static production build pass. Chromium fallback passes; Safari/ordinary child-process launch acceptance remains OPEN. |
| M01.2 | PASS | [Add the development harness and structured case reports](records/M01-2/notes.md) | Real product case runner, structured inputs/actual/expected/trace reports and dev-only harness. Unknown/unimplemented source cases cannot pass; fixture payload excluded from production. |
| M01.3 | PARTIAL | [Prove worker loading and transfer ownership early](records/M01-3/notes.md) | Native worker probe returns [1,2,3], sender detaches; production transfers, directory mount and offline fresh workers pass in Chromium. Safari remains OPEN. |
| M02.1 | PASS | [Implement strict TOML parsing, normalization and draft gates](records/M02-1/notes.md) | Strict staged TOML import, normalized defaults and runnable gates. Legacy and versionless uploads are rejected with no migration path. |
| M02.2 | PASS | [Build every configuration section and its references](records/M02-2/notes.md) | All 88 metadata fields have editors and plain-English help, including conditional fields/list cells. Medical fields live in the Budget section. Hover/focus/click/Escape/mobile bounds and focused wheel blocking preserve numeric/text/select edits. Brokerage and Cash USD accounts need no income settings; holdings and separate profiles are removed. Existing market/Medical controls and required-input gates remain; Social Security inputs are removed. |
| M02.3 | PASS | [Finish local upload/download and round-trip equivalence](records/M02-3/notes.md) | Local File.text/Blob downloads preserve UTF-8, immutable exports and reload equivalence. Current files carry no holding declarations; legacy uploads are rejected and the existing draft is preserved. No browser storage or configuration request. |
| M03.1 | PASS | [Import verified source rows using Node tooling](records/M03-1/notes.md) | Repeatable shared JS collector fetches all five fixed public sources. Frozen98 US years/39 China years/45 FX years and both income yields match independent stdlib raw readers; homepage live gateway applies validated source-backed inputs. |
| M03.2 | PASS | [Calculate population moments and freeze reference versions](records/M03-2/notes.md) | Observed US population statistics and China/FX calibration agree with independent arithmetic. Source stock dividend fraction and latest Treasury par-yield proxy are checked without adding yield to total return. |
| M03.3 | PARTIAL | [Load references in the static app and enforce source gates](records/M03-3/notes.md) | Frozen static reference hashes/versions and common input validation pass. Source verification remains a separate status for every configuration; only actual input/combination validation controls Run. |
| M04.1 | PASS | [Freeze PRNG seeding, output and draw-consumption conventions](records/M04-1/notes.md) | SHA-256 tuple seeding, xoshiro128**, little-endian state, open uniforms and fixed Box-Muller conventions match independent vectors. |
| M04.2 | PASS | [Implement bootstrap using unchanged historical rows](records/M04-2/notes.md) | Joint stationary bootstrap uses source rows unchanged for every config. Custom/affine/geometric-retarget logic is removed; finite total/post-yield domain checks remain. |
| M04.3 | PASS | [Implement China CPI, FX, indices and derived growth](records/M04-3/notes.md) | China AR CPI and FX drift/PPP/noise use S[0..T] and opening/ending indices; FX stress events and CNY interest are removed. Original applicable timing answers and legacy-field invariance pass. |
| M04.4 | PARTIAL | [Prove stable indexed streams and stochastic calibration](records/M04-4/notes.md) | Indexed full-horizon draws and spending-independent prefix/schedule stability pass. Observed population/compound calibration passes; broader empirical Monte Carlo distribution targets remain OPEN. |
| M05.1 | PASS | [Implement single-source budget spending and one-time costs](records/M05-1/notes.md) | Budget annual minus included health supplies ordinary spending. The single aggregate health base is counted once; every budget uses initial treatment and there is no budget mode. Recurring/flex rules are removed; one-time scopes remain. |
| M05.2 | PASS | [Implement aggregate medical growth, shocks and continuing additional care](records/M05-2/notes.md) | Medical price/age growth, two-person shocks and care from selected start age through final horizon pass. Care is always additional; no care end age/scope or per-person base exists. These tests do not calibrate clinical risk. |
| M05.3 | PASS | [Remove own Social Security](records/M05-3/notes.md) | Social Security inputs are removed and no benefits are ever paid. Both people stay alive; survivor rules are retired. Legacy values are discarded on import. |
| M05.4 | PASS | [Implement account journals, access, RMD and FX funding](records/M05-4/notes.md) | Fixed-by-asset income treatment retains tax classification without adding yield to total return. Access, basis, reinvestment, rebalancing, attribution, RMD and FX funding pass independent journals. Cash CNY earns zero interest. |
| M06.1 | PARTIAL | [Implement resident capital netting and income tax](records/M06-1/notes.md) | Supported resident tax/netting, annual loss deduction/carry and early penalty pass. Partial positive all-long-term Section1250 ordering uses checked 2025 IRS worksheets and independent carryover cases; the broader audit remains OPEN. |
| M06.2 | PARTIAL | [Implement NRA and citizen income-tax profile routing](records/M06-2/notes.md) | Declared citizen/resident and noncitizen/nonresident income-tax routing pass. Resident-alien income-tax branch and broad primary-source acceptance remain OPEN. No estate-domicile/tax transition exists. |
| M06.3 | PARTIAL | [Implement China tax, eligible payments and vintage FTC](records/M06-3/notes.md) | Eligible substantiated retained payments, partial remittances, country limits and annual FTC accounting pass. Legal expiry/refund/FX policies remain OPEN and are labeled example assumptions. |
| M06.4 | OPEN | [Audit primary sources and report source status](records/M06-4/notes.md) | The current 15-row registry keeps whole-rule acceptance unverified, with scoped 2025 IRS capital worksheet evidence recorded separately. The original 18-row M00 registry stays archived. No verification checkbox controls Run; the broad audit is OPEN. |
| M07.1 | PASS | [Implement property cash/basis/mortgage journals](records/M07-1/notes.md) | Rental cash/ScheduleE, mortgage, depreciation, owner USD/CNY bases and property-state journals reconcile to independent arithmetic. |
| M07.2 | PASS | [Implement feasible sales with citizen treatment and hold restriction](records/M07-2/notes.md) | Feasible closing cash/contributions, holding restriction, sale failure, owner withholding and FIRPTA settlements pass. Section 1231 loss history and lookback ordering are removed. |
| M07.3 | PASS | [Preserve fixed ownership and ending income-tax settlement](records/M07-3/notes.md) | Both people retain their alive status and account/property ownership through the inclusive younger-Max-age horizon. There are no transfers, basis step-ups or estate events; ending unpaid income taxes/confirmed refunds remain reconciled. |
| M08.1 | PASS | [Implement the ten-phase loop and exact 50-payment control](records/M08-1/notes.md) | The same year engine reproduces independent50-payment PV/FX controls with test-only literal rows. Solvent paths reach younger Max age; zero/negative net assets stop earlier, including before cash flows for an empty initial portfolio. |
| M08.2 | PASS | [Verify access, FX and nonpositive-net-worth stopping](records/M08-2/notes.md) | Financial years stop at nonpositive net worth; positive property equity can sustain simulation after a liquidity shortfall. Early/final closing taxes/refunds are retained, and future expenses/returns/tax years do not execute. |
| M08.3 | PASS | [Verify final bills, prior bills, refunds and payment order](records/M08-3/notes.md) | Real engine fixtures yield 500k assets minus30k unpaid tax=470k ending after-tax assets, prior tax funded from traditional accounts=464k, and FIRPTA90k cash plus130k confirmed refund=220k. No tax stub, artificial final cash remittance or hidden initial settlement. |
| M09.1 | PASS | [Execute bounded path chunks and aggregate off the main thread](records/M09-1/notes.md) | Bounded four-worker/64-path chunks, indexed assembly, transfers and off-main-thread aggregation pass actual production workers. |
| M09.2 | PASS | [Implement quantiles, fixed cohorts, rankings and scalar KPIs](records/M09-2/notes.md) | Type7 quantiles, whole-N fixed-lifetime cohorts, separate funding/ending-income-tax/budget metrics, stable ranking and Float64 scalar summaries pass. Legacy estate/flex/death output slots have compatibility meanings only. |
| M09.3 | PARTIAL | [Verify reproducibility, prefix stability and immutable replay](records/M09-3/notes.md) | One/four workers with delayed out-of-order chunks match all 1,000 compact paths exactly; 2000-path prefix and full replay paths 0/17/999 match. Cross-browser goldens remain OPEN. |
| M09.4 | PASS | [Implement cancel, full-run failure and stale-message protection](records/M09-4/notes.md) | Five cancel/restarts release workers, delayed old replies cannot replace a new run, summarizing cancellation discards results, and a later invalid CPI path fails all 4,000 requested paths. |
| M10.1 | PASS | [Connect run controls, validation and financial previews](records/M10-1/notes.md) | Validated run controls, previews, common validation, source status and immutable labels are connected to the engine. Paths/Seed and the TOML editor share accessible plain-English help; numeric controls block wheel stepping. |
| M10.2 | PASS | [Add charts and reconcile labels/metrics](records/M10-2/notes.md) | Worker wealth percentiles retain whole-cohort denominators and use zero after exhausted paths stop, avoiding survivor-only bands. Market bands remain unconditional over T; liabilities/funding/excess stay separate. |
| M10.3 | PASS | [Add full-precision ledger/provenance and immutable comparison](records/M10-3/notes.md) | Full-precision replay uses completed-run references, not refreshed global data. Integer ledger money and58-column CSV show only simulated years and stop metadata; original/pinned ledgers are byte-identical after refresh; data+TOML reproduce a run after reload. |
| M10.4 | PASS | [Complete config/run/ledger downloads and end-to-end round trip](records/M10-4/notes.md) | Current/run/baseline TOML, full-precision 58-column CSV and scientific manifests download locally; reload/re-upload reproduces scientific inputs and all aggregates. |
| M11.1 | PARTIAL | [Reconcile household facts, PV controls and observed compound returns](records/M11-1/notes.md) | Gross household facts and missing-field gates are preserved. PV/FX/medical controls and observed 40/60 compound calibration pass; the verified after-tax household forecast still needs facts and tax support. |
| M11.2 | PASS | [Replay dot-com/2008 annual losses and sequence effects](records/M11-2/notes.md) | Actual year loop reproduces the frozen two-year sequence and loss carryovers. Observed 2000–2002, 2008 and 2022 calendar tapes reproduce independent 40/60 Treasury balances, with and without beginning-year withdrawals. |
| M11.3 | PARTIAL | [Measure production performance, memory and cancellation](records/M11-3/notes.md) | Six genuine T52 warm runs meet 10s/90s gates, retain37.42MB, measure full-browser RSS and reject an oversized100k/T71 run plus baseline without changing N. The ordinary sample is T70. Safari performance remains OPEN; allocation guard is not an OS memory cap. |
| M11.4 | PARTIAL | [Verify static hosting, local files and offline computation](records/M11-4/notes.md) | Chromium covers static directory mounts, explicit public-data GET refresh, package import/export, failure/cancel preservation and offline fresh run/replay without config requests or storage. The public gateway has no user configuration input. Safari remains OPEN. |
| M11.5 | PARTIAL | [Perform the final automated acceptance and report open gates](records/M11-5/notes.md) | Supported observed-reference example release passes all automated checks, with usage and all 42 step records. Full household/legal/empirical-calibration/Safari acceptance remains OPEN; all external release gates are recorded. |

## Measured performance

Production Chromium, four real workers, explicit 52-year benchmark, 1-path warmup, three genuine runs per size, no tracing/result cache. Exact hardware/browser/configuration hashes are in the performance record; the ordinary sample has 70 years.

| Paths | Median Run-to-KPI time | Maximum |
|---|---|---|
| 2,000 | 1.828 s | 1.831 s |
| 20,000 | 9.856 s | 10.374 s |

20,000 paths over 52 years retain 37,420,000 bytes, including 33,280,000 chart bytes. Full-browser RSS peaked at 1.104 GB, sampled every 200ms; it includes browser overhead and worker heaps. The 512MiB preflight budgets modeled allocations plus a reserve, not an OS process cap. Requested 100,000 paths over 71 years with a 37.42MB baseline needs 533.9MiB of modeled allocations and is rejected before spawning workers, with N unchanged. [Full measurements/method](records/e2e/chromium-performance.json).

## Actual household readiness: BLOCKED

- B’s retained green card and US income-tax residency; required resident-alien branch is not implemented.
- Account ownership, brokerage bases, retirement split/access; placeholders remain visible.
- Property rent, bases/depreciation, operating costs, mortgage terms and transaction assumptions.
- Single included 38,000 CNY medical base, commercial insurance, growth/shocks/care; care is always additional.
- China residence/domicile policy and applicable primary rules. Social Security is excluded from the simulation.
- Observed NYU/FRED inputs and calendar 2000–2002/2008/2022 replays pass; broader empirical Monte Carlo targets remain OPEN.

Missing required inputs and unsupported tax branches block every configuration. Source verification is reported separately and does not change calculations or Run eligibility. All five Simulation metadata fields and their gates are removed; recognized legacy values are discarded on import. Simulation exposes only start year, path count, seed and maximum age, with synchronized Random seed buttons. Everyone stays alive through the younger Max age (or the person's, when alone). Budget supplies ordinary spending and the single aggregate medical base; Medical supplies shocks and continuing always-additional care. Social Security is excluded: no benefits are ever paid. Cash CNY interest is deliberately omitted, with a Markets note. Decimal input text is preserved; ledger money displays integers while calculations/CSV remain full precision. The household constructor preserves $5.3M gross financial assets, property $2M/loans $731k, ages 40, FX 6.69, 250k CNY with 38k included health, and hold/last-resort-sale=false; it uses referenced tax rates, not control overrides. Examples use observed US history; empty overrides retain historical returns and do not impose a 3% target. China/FX paths still use configured parameters.

## Browser and evidence limits

Chromium runs with a single-process workaround because this host denies child-process Mach-port registration. Real UI/workers/transfers/downloads are tested. WebKit/ordinary browser-process launch fails before app load; no Safari PASS is claimed. [Browser results](records/browser-results.json), [current source gates](../src/reference/source-gates.json), [independent M00 archive](records/M00/acceptance.md).
