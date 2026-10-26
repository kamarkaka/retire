# Retirement Monte Carlo Simulator: Design Spec

- **Date:** 2026-10-18
- **Status:** Browser web app with a public-data refresh gateway implemented through the M00–M11 software steps, with automated verification of supported examples. Human milestone sign-offs are retired by user instruction; automated acceptance compares applicable cases with the independent M00 oracles; superseded cases are explicitly retired. See [implementation status](../verification/implementation-status.md) for actual PASS/PARTIAL/OPEN scope. Financial corrections, common input validation and source status remain explicit (§6.9, §9.2, §13).
- **Implementation plan:** [Milestones and automated verification](2026-10-18-retirement-sim.md)
- **Project root:** `/Users/mengcao/development/retire` ([app usage and test commands](../README.md)); bundled US market rows are observed NYU/FRED history; independent source receipts and calibration are recorded.
- **Review record:** [Review request](2026-10-18-retirement-sim-design-review-request.md) and [independent decisions](2026-10-18-retirement-sim-design-review-decisions.md).

### Revision log (spec review, 2026-10-18)

1. **Social Security exclusion:** no benefits are ever paid and there are no Social Security inputs (§5.4).
2. **Configurable number of paths.** `n_paths` goes from 1 to 100,000 and can be set in uploaded/downloaded TOML or the app. Results are stored compactly so 20,000 paths fit in memory (§1.3, §3, §7.1, §8).
3. **Every model parameter is an input:**
   - Select the historical US sample window; all configurations use its source rows directly (§4.3.1).
   - FX gets a simple `drift` mode (§4.5).
   - China CPI, FX, medical and yield parameters are inputs.
4. **Today's money.** Every amount you enter is in today's purchasing power and is inflated to the year it's paid (§5.0).
5. **One bundled tax table.** Every configuration uses the same bundled reference tables; there are no per-scenario overrides (§6.8).
6. **Budget spending:** the subsequent user revision removes recurring-spending lists and flexible-spending rules (§5.2).
7. **Fix: the capital-gains formula's ordinary-rate ceiling.** It is the top of the **24%** bracket (the statute says "taxed at a rate below 25%"), not the 22% bracket. All test values were re-verified, and a new case, US-6, exercises the 25% cap.
8. **Clarifications made while planning:**
   - The original spending-rule schema is archived; the later user revision removes that rule.
   - "US tax" in China's FTC initially meant federal plus state tax; revision 12 restricts this to eligible income taxes.
9. **Capital netting (R1):** net losses against relevant gains before assigning rate buckets, deductions and carryforwards (§6.2).
10. **No FIRPTA withholding (R2 retired):** US property sales assume citizen ownership with no closing prepayment; same-year ECI tax is computed and paid with no withholding, prepayments or refunds (§5.8, §6.3).
11. **Same-year tax payment (R3):** compute and pay bills the same year with iteration; sub-dollar leftover carries and the terminal memo deducts leftovers. The subsequent fixed-lifetime revision retires death transitions (§5.9–§5.10, §6.7).
12. **China FTC eligibility (R4):** credit same-year eligible US-paid tax with pension exclusion; no vintages or carryforward (§6.4).
13. **Explicit classifications (R5):** citizenship, income-tax residency and one household China/US domicile are the classifications; investment-income treatment is fixed by asset. Estate domicile/situs fields are retired with death processing.
14. **Market domains (R6):** use unchanged source rows; reject invalid source or generated factors before simulation. Use population SD consistently (§4, §9.2).
15. **Medical budget (R7):** reconcile included recurring costs, disclose combined growth, and treat every budget as initial (§5.2–§5.3).
16. **Benefits (R8):** own-benefit age/payability gates remain. Survivor benefits are retired because everyone remains alive.
17. **Household acceptance:** add a separate age-40 household scenario and an exact 50-payment arithmetic control; enforce the chosen property-sale restriction (§9.3, §11).
18. **JavaScript web app:** React + TypeScript + Vite, a pure TypeScript model, and browser Web Workers replace the previous application/runtime (§3, §8, §10).
19. **Client-owned configuration:** upload TOML or build a configuration in the app; validate, edit, run and download locally. No server-side scenario files or configuration APIs are required (§3.3, §8, §9).
20. **Automated acceptance:** every implementation step has test criteria, independent expected results, and recorded evidence (§11.4). No human sign-off is required.
21. **FX/precision clarification:** real CNY returns explicitly include FX and China inflation; numerical residual handling cannot create a false depletion at the exact 50-payment control (§4.5, §6.5).
22. **M00 contract freeze:** explicit LTCG rate array, canonicalization/draw/layout contracts, complete field mapping and independent fixture oracles (§6.8, §9.4). Numerical checks do not verify legal sources or household facts.
23. **Automated continuation:** user retired manual verification; retain milestone order, build a static React/TypeScript app and execute a full sample-config browser workflow. Observed NYU/FRED references are now integrated and checked independently. Keep original synthetic artifacts archived; broad legal/household/empirical-calibration acceptance remains separate.
24. **Implementation records:** actual module paths below, a generated application/build-input SHA-256 in run manifests, inline bundled workers for fresh offline computation, cancelable replay/comparison, and Float64 matched-path deltas. China bills are recorded net of the same-year US credit. Browser/source limitations are separate OPEN acceptance items.
25. **Resource and draft scope:** allocation preflight budgets known buffers/workspaces/pinned results plus a reserve; it is not a cap on whole-browser RSS or JavaScript heaps. Record measured process memory separately. Household constructors use the unverified reference tax tables and leave residency/entitlement facts open; zero-rate overrides belong only to arithmetic controls.
26. **Unified configuration behavior:** Remove Simulation kind, assumptions, unresolved-input lists, legal-verification boolean and verification note from the UI, schema, templates, exports and manifests. All configs share calculations and validation. Recognized legacy metadata is rejected on import; actual required values and supported combinations determine Run eligibility.
27. **Random seed controls:** A Random button beside each seed input uses browser `crypto.getRandomValues(new Uint32Array(1))` to choose an integer in the inclusive range 0–4,294,967,295. Both controls edit the same draft seed. Completed/active snapshots keep their original seed.
28. **Year-ledger reporting:** Add start-of-year USD liquid balance and nominal CNY net worth, spending excluding medical, complete medical costs, and balance-weighted annual financial return including Cash CNY. Preserve the core 38-field buffer and cash-flow calculations; replay/CSV add five reporting values with `retire-ledger-report-v1` (43 CSV columns).
29. **Section 1250 removed (supersedes the checked-subset revision):** fold recapture into LTCG rates; §1250 oracles are RETIRED and scoped evidence is archived; keep the broader legal audit open (§6.2, §6.9).
30. **Fixed lifetimes:** everyone stays alive until the younger (or the single person) reaches Max age, inclusive. Remove Gompertz/death inputs, draws, survivor benefits, transfers and estate events; record this policy in manifests.
31. **Sample people:** A: 1986/Female/US citizen; B: 1986/Male/non-US citizen; household domicile China. Sex is descriptive only. B's example nonresident income-tax status is not evidence of the actual green-card holder's status.
32. **Budget and Medical:** remove recurring-spending lists/flex and People medical bases. Budget contains the single aggregate base medical amount. Medical contains shocks and late-life care: enabled, start age, selected person, monthly CNY and real growth. Care is always additional and lasts through the final horizon year; there is no end age or care budget scope.
33. **Builder and ledger:** group market fields into Markets, Inflation and FX. Display ledger money as integers while preserving calculation/CSV precision. Social Security inputs are removed.
34. **Numeric entry:** preserve decimal text during typing, including `0.003`; accept signed finite rates and synchronize values after external configuration changes.
35. **Zero-interest Cash CNY:** remove Cash CNY real rate/floor and all generated deposit interest. Preserve deposits/withdrawals and FX/inflation valuation. Display the deliberate omission and possible future restoration; model v5.1 records `cny_cash_policy = "no-interest"`.
36. **Tax simplification revision:** remove state tax, Social Security inputs/taxation, the 65+ add-on, the senior deduction, the §1250 25% bucket, and all settlement/payment-timing/FTC-vintage machinery. Compute and pay bills the same year with iteration; China bills are net of the same-year US credit; leftovers are a terminal memo. Retire the dependent oracles (US-1/2/4/5/6/7/8, NRA-1, CN-2/PARTIAL/WITHHOLDING, TERMINAL-1/REFUND/DEFICIT, ENGINE-FINAL-TAX/PRIOR-TAX) and archive the scoped §1250 evidence. Where §5–§6 prose below still describes the removed mechanics, this item plus contracts.md and traceability.md state the current behavior.

36. **Historical rows for all configurations:** remove Custom return/US-inflation controls and FX stress events, including their rescaling/event logic. Recognized legacy fields are discarded on import; invalid legacy types still fail.
37. **Repeatable market refresh:** the homepage button fetches five fixed public NYU/FRED sources, validates one complete data package and applies history, income yields and spot FX atomically. Configurations remain browser-only; completed/pinned runs retain their original reference snapshot. Upload/download market data packages support static hosting and reproducible runs.
38. **Stop at nonpositive net assets:** financial paths stop at the inclusive younger-Max-age horizon (or the single Max-age horizon) or the first nonpositive year-end net worth (investments, Cash CNY and property equity after mortgages). Nonpositive initial net worth stops before annual cash flows. Settle taxes/refunds at the stop; ledger/CSV end there, and later wealth percentiles include stopped paths as zero.
39. **Plain-English input help:** every configuration input, including conditional controls, list cells, run controls and the TOML editor, has an informational popup on hover or keyboard focus. Info buttons support taps; Escape dismisses help. Explanations describe actual units, interactions and inactive settings without changing calculations.
40. **Wheel-safe numeric entry:** focused numeric editors ignore mouse-wheel stepping while preserving value and keyboard focus. Decimal text, signed entry and normal keyboard edits remain supported.
41. **Fixed-by-asset income treatment:** remove holdings sections, named maps and reference fields. Stocks pay qualified dividends, bonds pay coupon interest with zero-gain sales, cash earns money-market interest, and Cash USD earns its rate or the T-bill return. Old holding declarations drop on import and the retired taxable type maps to brokerage.


---

## 1. Purpose and success criteria

### 1.1 What it answers

For one household, the simulator answers: *"If we retire in mainland China starting in `start_year`, how likely is our money to last for both our lifetimes? How do our decisions, and the shocks we can't control, change that?"*

- **Decisions:**
  - spending level;
  - asset allocation;
  - withdrawal order;
  - which spouse owns which asset;
  - whether to hold and rent the US property or sell it, and when.
- **Shocks:**
  - US markets;
  - US and China inflation;
  - USD/CNY;
  - medical events;
  - market sequences over the full configured horizon; both spouses live through every simulated year.

Results are statistics over thousands of randomized paths. You explore them in a browser app; simulation and configuration editing run on your device.

### 1.2 Household facts and supported tax assumptions

The actual couple has no children, one US citizen and one green-card holder. Financial assets are $5.3M gross before withdrawal taxes; property is $2M with $731k of loans. The annual RMB250,000 budget includes the stated RMB38,000 social-insurance/medical component. These facts belong in the separate household draft (§9.3).

| Sample input | Person A | Person B |
|---|---|---|
| Birth year / descriptive sex | 1986 / Female | 1986 / Male |
| US citizenship | Yes | No |
| US income-tax status | Citizen/resident; Form 1040, MFS throughout | Nonresident; Form 1040-NR, explicitly an example assumption |
| Household domicile | China for both; worldwide-income branch | (same household) |

Everyone remains alive through the younger person's Max age year (or the person's, when alone). The sample starts in 2027 with two people, so both are 41; Max age 110 gives 70 rows. The separate 2026 age-40 control with Max age 89 gives exactly 50 rows. Sex has no effect on lifetimes, costs, returns or tax arithmetic.

Citizenship and US income-tax residency are per-person fields; one household China/US domicile covers one or two people. Noncitizenship and living in China do not establish NRA status. A retained-green-card/resident-alien branch is not implemented; it cannot be routed to NRA automatically. Actual missing values remain editable financial fields in the household draft; there is no Simulation checklist or verification checkbox controlling Run.

### 1.3 Success criteria for the software

1. **Reproducible runs.** Uploading a TOML file and building the same normalized configuration produce the same run. With the same seed, model/RNG/reference versions and browser engine, path results are identical regardless of worker count, chunk size or completion order (§3.2). Export a run manifest to identify those inputs.
2. **Speed and scale.**
   - `n_paths` is configurable from 1 to 100,000 (default 2,000) in the uploaded/built configuration and the app.
   - Browser-worker targets on the named laptop/browser are 2,000 paths under 10 s and 20,000 under 90 s. They are acceptance targets, not measurements already achieved (§10, §11.3).
   - Progress, cancellation and input interaction remain responsive. Estimate memory before allocating a large run, including a pinned baseline (§3.2, §11.3).
3. **Realistic randomness.** Every random input is grounded in data (§4) and passes the realism checks in §11.2.
4. **Correct tax and cash accounting.** Tax results match §11.1; same-year bills, eligible credits and leftover memos reconcile. Complete §6.9 source checks before representing results as a household tax forecast.
5. **Complete app.** The app can:
   - edit every scenario field, including market parameters and tax tables;
   - run the scenario;
   - show the outputs in §7;
   - drill into one path's year-by-year ledger;
   - compare against a pinned baseline that uses identical random draws;
   - upload TOML, build a configuration from editable forms, and download TOML, a run manifest and a full-precision single-path CSV;
   - perform these operations without a user-configuration API or a server-side scenario directory.

---

## 2. Scope

The current scope is a static browser app with client-owned configurations, full-horizon market simulation, budget/medical/own-benefit expenses and income, financial accounts, rental properties, supported US/China income-tax branches and year-by-year funding with same-year tax payment.

Deferred work includes resident-alien/treaty-residency branches, §6013(g) elections, Roth conversions, AMT/short-term gains/wash sales, lot-level CNY gain accounting, detailed tax-status transitions, SSA earnings-history optimization and additional asset classes. Both-person mortality, survivor/estate events and flexible recurring-spending rules are outside the current model by user instruction.

Observed US history and China/FX calibration references now pass independent source checks. Broad primary legal-source acceptance, household fact completion and broader empirical Monte Carlo targets remain separate OPEN requirements. A sample run does not establish a household FIRE funding recommendation.

---

## 3. Architecture

### 3.1 Data flow

**Framework:** React + TypeScript + Vite. TypeScript compiles to JavaScript; the delivered app is a static single-page application. React fits the large editable form and linked result views. Vite bundles the browser app and module workers. Dev/preview hosts also expose a read-only public-market-data gateway; it accepts no financial input or server configuration. The calculation engine has no React or DOM dependency.

```text
Local TOML upload ──► parseScenario ──┐
React configuration builder ─────────┴─► DraftScenario
                                         │ normalize + validate
Bundled public reference data ────────────┼─► Scenario + effective tax tables
                                         │ immutable RunRequest + manifest
                              browser module Web Worker pool
                                ├─ deterministic per-path streams
                                ├─ generateMarketPath + makeDraws
                                └─ simulatePath → compact series + PathSummary
                                         │ transfer typed arrays; index by path ID
                              worker summary / single-path replay
                                         │
                         React + ECharts + paginated ledger table
                                         │
                       local TOML / manifest / ledger CSV downloads
```

### 3.2 Principles

- **Pure model functions.** Use JavaScript `number` and `Float64Array` for money, tax calculations, market paths, ledgers and scalar path summaries. Round only for display/export formatting (§6.5). React receives outputs; it does not implement a second version of any formula.
- **Versioned randomness.** Use xoshiro128** with explicit unsigned 32-bit operations. Seed each independent stream from the first 16 bytes of SHA-256 of the UTF-8 JSON tuple `["retire-rng-v1", seed, pathId, component, entityId]`, read as four little-endian uint32 words. Replace an all-zero state with `[1,0,0,0]`. Use a synchronous browser-compatible SHA-256 implementation from `@noble/hashes`. Freeze reference seed/state/output vectors before model integration.
  - Components are `bootstrap`, `cn_cpi`, `fx`, `medical_occurrence`, `medical_size`, and `property`. Global components use an empty entity ID; person components use `A` or `B`; properties use a persisted `properties[].id`.
  - An open-interval uniform is `(nextUint32() + 0.5) / 2^32`. Normal pairs use Box–Muller with a fixed cosine-then-sine order. Pin its draw-consumption convention and numerical tolerances in the verification fixtures.
  - Generate every path's full market and latent household/property draws **before** its financial year loop. Consume one candidate-index uniform for the initial bootstrap row, then a jump and candidate-index uniform for every later year, including when no jump is selected. Enabled switches, taxes, spending and withdrawal decisions do not change stream consumption. Generate in bounded worker chunks rather than retaining all `N × T` latent arrays.
  - Streams are keyed by stable path IDs starting at zero, independent of path count, worker count, chunking and scheduling. Increasing path count preserves the original prefix. Property order does not change a property's noise; adding a property does not change existing streams.
  - Common random numbers mean the same latent draws under the same stream/version/timeline contract. Changing a market parameter intentionally changes the modeled path. Changing spending alone leaves market paths unchanged. A comparison must verify compatibility rather than relying on seed alone (§8.4).
- **Deterministic arithmetic order.** Assemble results by path ID and reduce/sort in that order. The same browser engine/build must reproduce raw numeric results exactly across worker counts. Cross-browser checks require identical integer RNG vectors, identical discrete decisions for the acceptance fixtures, and full-precision monetary results within USD/CNY0.01; transcendental functions need not be bit-identical across browser engines. Tiny numerical differences at decision boundaries must be investigated, not treated as arbitrary failed-path exclusions.
- **Nominal inside, real for reporting.**
  - Real CNY = nominal CNY ÷ China price index.
  - Real USD = nominal USD ÷ US price index.
  - Both indices are 1.0 at the start of the first simulated year.
- **Annual time step and fixed lifetimes.** `T = max_age − min(present start ages) + 1` for one or two people. Everyone is alive in every row, including the younger person's Max age year. The older person can exceed Max age. Ages 61/59 with Max age 110 give T=52; both 40 with Max age 89 give T=50; both 41 with Max age 110 give T=70. There are no drawn deaths or inactive post-death rows. Monthly inputs are multiplied by 12.
- **Financial stopping rule.** T is the upper bound. Stop after the first year with `cleanResidual(net_worth_cny) <= 0`, or before the first cash flow if starting net worth is nonpositive. Net worth values USD accounts, Cash CNY and property equity after mortgages at that boundary's FX. Liquidity shortfalls alone do not stop a path with positive total net worth. Deduct leftover unpaid tax once at the stop; no subsequent financial year executes. Record reason/year/index/net worth in replay and CSV metadata; initialize unused ledger/chart slots to NaN. For cohort wealth charts only, terminated paths contribute zero after the stop. A fully funded last Max-age year that spends its final dollar remains a funding success.
- **No financial constant hides in the engine.** Every number in §4–§6 comes from the normalized scenario or effective tax tables. Schema defaults, browser starter constructors and the documented example agree. Algorithm/version identifiers are recorded separately.
- **Compact results.** Keep `CHART_FIELDS` in `Float32Array` and compact scalar summaries in typed arrays. At `N = 20,000`, `T = 52`, seven chart fields take 29,120,000 bytes before summaries. Full ledgers and tax provenance are regenerated for the selected path from the immutable run request. Float32 chart data never determines depletion, capital netting or tax liability. Scalar monetary KPIs use Float64 summaries; chart bands are approximate visualization data.
- **Bounded memory.** A worker holds only its current path/chunk and immutable references. Transfer result `ArrayBuffer`s rather than cloning them. Before allocation, estimate chart arrays, summaries, worker workspace, aggregation buffers and any retained baseline. A resource rejection reports the estimate and keeps the requested path count unchanged. No mandatory `SharedArrayBuffer` or cross-origin-isolation headers.
- **Responsive execution.** A small module-worker pool performs simulation, aggregation and ledger replay. The main thread handles form state, short buffer copies and rendering. Job messages include `runId` and path ranges. Cancel terminates active job workers; late messages cannot replace another run. Any invalid generated factor fails the entire run, discards partial statistics and identifies its path/year (§4).
- **Immutable runs and provenance.** Normalize and snapshot the scenario, merged tables and reference data at Run. A manifest records schema/model/RNG/build versions, canonical scenario SHA-256, data/table hashes, seed, path count and horizon. Browser/worker/timing details are execution metadata. Editing a draft cannot mutate an active or pinned run.

### 3.3 Configuration and data ownership

- **Configuration is client-owned.** Read selected files with `File.text()`; construct new drafts in browser memory; validate and calculate locally; download with `Blob` and object URLs. A static host supplies app assets. There is no required scenario directory, configuration upload endpoint, database, server session or server-side user file.
- **TOML is the portable input format.** Use `smol-toml` for parsing/serialization and Zod for strict schema validation. The builder and uploaded files pass through the same normalization/validation functions. Add root `schema_version = 1`; preserve omitted required financial values and stable property IDs when exporting. Unknown fields produce errors rather than disappearing.
- **Draft and runnable configurations differ.** Drafts can contain supported `unresolved` classifications and blank/incomplete fields. Complete drafts export as TOML even when run gates remain open. Structurally incomplete drafts remain editable; a draft export may omit blank required fields, and re-import restores those omissions as field errors. Run requires a complete, supported scenario. Legacy and versionless files are rejected; there is no migration path (§9.2).
- **Starters are browser constructors.** `createEmptyDraft`, `createExampleDraft`, and `createHouseholdDraft` produce objects in code. The documented TOML example is an export example, not a file the server must read. The household constructor retains unresolved facts (§9.3).
- **Public references are application assets.** Compile the checked historical JSON arrays, source/calibration manifest, source-verification registry and default tax-table object into the build. These are public model references, not saved user configurations. Data import/calibration is a development task; a normal simulation does not fetch Damodaran/FRED or read server files. The bundled tax tables are identical for every scenario.
- **Session state stays in memory.** Download is the persistence mechanism in v1. Reloading starts a new session; the user can re-upload a saved file. Display this beside Download. A completed current result and one pinned baseline may be retained within the memory budget. Browser database persistence/cloud sync are deferred.

### 3.4 Files

| File | Responsibility |
|---|---|
| `src/config/schema.ts`, `config.ts`, `constructors.ts`, `fields.json`, `downloads.ts` | Draft/runnable validation, TOML normalization, builder metadata, browser constructors and local exports |
| `src/model/rng.ts`, `canonical.ts`, `types.ts` | Versioned PRNG/path/entity draws, canonical hashing and typed state/protocol contracts |
| `src/model/market.ts` | Source rows, stationary bootstrap, CPI/FX/derived paths and domain checks |
| `src/model/consumption.ts`, `preview.ts` | Single-source budget spending, aggregate medical base, shocks and continuing care |
| `src/model/accounts.ts` | Account state, returns, basis, rebalancing, withdrawals, RMDs |
| `src/model/property.ts` | Annual cash flow, depreciation, mortgage and sale (no withholding) |
| `src/model/tax.ts` | Resident/NRA calculations, netting, same-year credit, ending memo; unsupported worksheets fail explicitly |
| `src/model/engine.ts`, `layout.ts`, `results.ts`, `comparison.ts` | Single-path year loop, Float64 ledger/provenance, compact results, Type7 quantiles and matched-path deltas |
| `src/workers/simulate.worker.ts`, `analysis.worker.ts`, `pool.ts` | Chunk execution, aggregation/replay/comparison, run-ID guards, cancellation and transfer ownership; messages use model types |
| `src/App.tsx`, `main.tsx`, `src/components/` | React builder/file/run state, ECharts, results/comparison and paginated ledger |
| `src/reference/*.json`, `bundle.ts`, `calibration.ts` | Bundled observed public references, population moments, hashes and unverified legal-source registry; no user scenario fetch |
| `scripts/import-data.ts`, `verify-data.ts`, `build-info.ts`, `build-inputs.ts`, `verify-build.ts` | Development-only BIFF8 import, reference verification, reproducible build fingerprint and static-distribution checks |
| `verification/fixtures/`, `verification/records/`, `scripts/verify-case.ts` | Independently checked test inputs/oracles, automated acceptance reports and model verification runner; no production config dependency |
| `src/verification/` | Development-only verification harness for inspecting inputs, actual/expected outputs and path traces |
| `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `index.html` | Reproducible JavaScript build and static entry point |

Use typed named objects for scenario/state/provenance and typed arrays for numeric time series. Keep financial serialized keys consistent with §9; any internal name mapping is explicit and round-trip tested.

---

## 4. Market model (hybrid; every parameter is an input)

### 4.1 Bundled data

The implementation bundles these public reference files into the static build. `scripts/import-data.ts`, `bundle-data.ts` and `verify-data.ts` record/check retrieval dates, source editions, raw/derived checksums, sample windows and conventions in `src/reference/provenance.json`. Independent Python standard-library readers reconcile raw workbook/CSV values and population arithmetic before activation. After app/worker assets load, computation works with the network disabled. Cold offline loading requires browser-cached assets; a service worker/PWA is deferred.

| File | Columns (decimals, e.g. 0.1185) | Source | Notes |
|---|---|---|---|
| `src/reference/history.json` | `year, us_stocks, us_bonds, usd_cash, us_cpi, us_home` | `https://pages.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls`, sheet "Returns by year". Data starts at row index 20; columns 0=Year, 1=S&P 500 incl. dividends, 3=3-month T-Bill, 4=US T-Bond (10-year), 6=Real Estate. CPI comes from FRED `CPIAUCNS`, Dec/Dec | 1928–2025, 98 rows |
| `src/reference/cn-cpi.json` | `year, cn_cpi` | FRED `FPCPITOTLZGCHN` (World Bank, annual-average basis) | 1987–2025. Used for displayed calibration references and tests; configured parameters drive future paths |
| `src/reference/usdcny.json` | `year, date, usd_cny` | FRED `DEXCHUS`, last valid daily value of each year | 1981–2025. Used for displayed calibration references and tests; configured parameters drive future paths |

The FRED download URL is `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<ID>`. The header is `observation_date,<ID>`, and missing values are empty strings.

Data gotchas:
- **Use the .xls, not the HTML page.** The HTML table is stale and ends in 2023.
- **CPI comes from FRED,** not from Damodaran's column, whose 2025 value is Nov/Nov.
- **"T-Bill" is the annual average yield.**
- **"Real Estate" is the Case-Shiller price change only.** The 2025 value is preliminary (1.58% vs Dec/Dec 1.16%), but it is accepted as-is.
- **Reading .xls is a development task.** Select and pin a Node-compatible spreadsheet reader that supports legacy BIFF `.xls`; verify it against the named sheet/rows before import. Neither the browser runtime nor its users need that reader or raw workbooks (§10).

### 4.2 Observed calibration and remaining empirical targets

The observed means, population SDs and correlation matrices are reproduced independently in `verification/records/M03/data-report.json`. All SDs use `ddof = 0`, consistent with §4.3.1. Calculate exact moments from the selected window; do not substitute rounded references into rescaling. The earlier drawdown and Monte Carlo measurements below remain separate empirical targets; source reconciliation does not certify those measurements.

| 1928–2025 | Arith. mean | Geo. mean | SD | Worst year | Max nominal drawdown | Max real drawdown |
|---|---|---|---|---|---|---|
| S&P 500 | 11.85% | 10.02% | 19.30 | −43.8% (1931) | −64.8% | −54.8% |
| 10y T-Bond | 4.82% | 4.53% | 7.86 | −17.8% (2022) | −21.5% (2020→22) | −55.5% (1940→81) |
| T-Bill | 3.41% | 3.37% | 3.02 | 0.03% | 0 | −45.8% |
| US home prices | 4.38% | 4.20% | 6.15 | −12.0% (2008) | −26.2% | −34.6% |
| US CPI (Dec/Dec) | 3.11% | — | 3.88 | −10.3% (1932) | — | — |

- **Autocorrelation (lag-1):** CPI 0.61, T-Bill 0.92, home prices 0.67. Stocks and bonds are about 0.
- **China CPI, 1997–2025:** observed mean 1.7628%, population SD 1.7858 pp; AR(1) fit on 28 adjacent pairs gives φ=0.303678, long-run mean 1.6838% and residual population SD 1.7232 pp. The 2025 annual-average value is 0.059565%. These reference fits do not overwrite configured inputs.
- **US–China CPI correlation:** about 0.
- **USD/CNY, annual log change of year-end rates, 2006–2025:**
  - observed mean −0.7163%, population SD 4.6153 pp;
  - excess kurtosis −1.13, so there are no fat tails at annual frequency;
  - correlation with the S&P is −0.06;
  - spot is **6.692** (2026-10-09).

### 4.3 US block: stationary block bootstrap

For each path, draw row indices into the sample window `[sample_start, sample_end]` (K rows):

- `idx[0]` is uniform on `{0..K−1}`.
- For each later year `t ≥ 1`, with probability `1/block_mean_years` jump to a new uniform index. Otherwise take the next year: `idx[t] = (idx[t−1] + 1) mod K`, wrapping round to the start.
- From each sampled year, take `us_stocks, us_bonds, usd_cash, us_cpi, us_home` **together**, unchanged from their source rows (§4.3.1).
- Defaults: window 1928–2025, `block_mean_years = 8`.

Earlier reference measurements, to reproduce with pure history (N = 20,000, T = 40):
- Means are preserved: stocks 11.83%, bonds 4.83%.
- The worst simulated bond year is −17.83%, the same as history.
- Probability of a nominal bond drawdown worse than −35%: 0.19%. Worse than −40%: 0.02%.
- Probability of a **real** bond drawdown worse than −50%: 9.3%. This is inflation erosion, and it is intended.

#### 4.3.1 Unchanged historical series and domains

All configurations sample the exact selected-window source rows. There are no Custom means/volatilities, affine rescaling, geometric-target adjustments or hidden constant-return configuration modes. Changing the sample window changes the observed sample; changing income yields changes its taxable-income split, and adds no total return.

Use population moments/correlation for descriptive statistics. Validate finite source factors, nonnegative unlevered total-return factors and post-yield price factors, and strictly positive inflation/home-price index factors. Generated China CPI, medical indices, FX and combined property factors must remain valid and finite. Invalid requested jobs fail with series/path/year context; no clipping, resampling or selective path removal.

Fixed 3% arithmetic/PV controls use explicit literal annual rows in development-only `verification/market-tapes.ts`, passed to the same engine. The browser 50-year planning example uses historical rows like every other configuration. The obsolete original projection oracle remains archived and is RETIRED.

### 4.4 Home-economy CPI: AR(1)

`π_home[t] = μ + φ·(π_home[t−1] − μ) + σ·ε_t`, where `ε ~ N(0,1)` and `π_home[−1] = home_cpi_start`.

- Defaults: `home_cpi_mean` μ = 0.017, `home_cpi_phi` φ = 0.30, `home_cpi_sigma` σ = 0.018, `home_cpi_start` = 0.001.
- It is independent of US CPI.
- Provisional reference: mean 1.68%, SD 1.89%, lag-1 autocorrelation 0.30.
- The process always runs, but spending uses it only when the domicile has no historical inflation rows (currently every domicile except the US, whose spending inflation replays history).
- **Admissibility policy:** retain Gaussian AR(1), but check all generated CPI before building indices/PPP logarithms. Any `π_home ≤ −1`, nonfinite value, or nonpositive medical-price factor invalidates the complete run. Report the failure without success probabilities. No clipping or path rejection/resampling is used; a truncated/log-price model is a separate future change. Validate deterministic zero-sigma sequences identically.

### 4.5 USD/CNY: partial adjustment toward a PPP path

`S[t]` is CNY per USD at the **start** of year t. It is the conversion rate used during year t. `S[0] = fx_spot`. Arrays have length T+1, and `S[T]` values the final year end.

For t ≥ 1:

```
log P[t] = log P[t−1] + log(1+π_home[t−1]) − log(1+π_us[t−1]) + fx_real_trend     # PPP path; log P[0] = log fx_fair_value
log S[t] = log S[t−1] + λ·(log P[t] − log S[t−1]) + σ_fx·η_t          # η ~ N(0,1)
```

- Defaults:
  - `fx_spot` = `fx_fair_value` = 6.692;
  - `fx_adjust_speed` λ = 0.15 (half-life ≈ 4.3 years);
  - `fx_sigma` σ_fx = **0.042**;
  - `fx_real_trend` = 0.
- Why 0.042 and not the 0.045 discussed in chat: the PPP pull adds volatility of its own. With 0.042, the measured annual log-change SD is 4.73%, matching 2006–2025's 4.74%.
- **Why the PPP pull exists.** It is a scenario assumption linking the exchange-rate path to relative price indices. It is not a forecast or an automatic preservation of purchasing power.
- **Effect on purchasing power.** A USD portfolio's one-year real CNY gross return is `(1 + r_usd[t]) × S[t+1] / S[t] / (1 + π_cn[t])`. FX and China inflation therefore affect affordability under either mode. Earlier PPP simulation references—roughly −1.1%/year nominal median drift, year-10 median 6.20 (5–95%: 4.81–7.95), year-30 median 4.87 (2.66–8.42)—remain provisional until reproduced from the versioned data/RNG. Show the assumption and real-return relationship in app help.
- **Steady state under a constant inflation gap.** If the PPP path moves by `g = Δlog P` per year, the deviation `d = log S − log P` converges to `d* = −(1−λ)/λ · g`.
- **`fx_mode`** chooses the formula:
  - `ppp` (default) uses the formula above.
  - `drift` replaces it with `log S[t] = log S[t−1] + fx_drift + σ_fx·η_t`. USD/CNY then moves by your expected annual change regardless of inflation; for example, `fx_drift = −0.01` means CNY appreciates about 1% a year.
  - The app warns that `drift` breaks the inflation link, so real CNY results then depend directly on the drift you choose.

### 4.6 Derived series

| Series | Formula / default |
|---|---|
| US price index at the start of year t | `Π_{s<t}(1+π_us[s])` |
| China price index | `Π_{s<t}(1+π_cn[s])` |
| Medical price index | `Π_{s<t}(1+π_cn[s]+medical_excess_inflation)`. Excess 0.02 |
| Property value growth | `(1 + us_home[t] + appreciation_premium)·exp(idio_sigma·z − idio_sigma²/2) − 1`, with z drawn from that property's stream |
| Taxable income split | Income = `income_yield × start-of-year value` (sourced example: stocks 0.01335854176478289, bonds 0.051). For `usd_cash`, the whole return is income. Price change = total return − income |

All used gross factors and outputs must be finite. For every property's generated path, require `1 + us_home + appreciation_premium > 0` and a finite positive factor after multiplying by the idiosyncratic exponential. Medical factors require `1 + π_cn + medical_excess_inflation > 0`. A holding's total loss of exactly 100% is supported only if its used price/income decomposition also remains valid; a zero holding balance must not cause log or return-weight division errors.

Market asset classes describe economic returns. Fixed asset treatment (§5.5) classifies stocks as qualified dividends and bonds/cash as ordinary interest; NRA treatment is dividends on equity and exempt interest otherwise.


**Cash CNY:** interest is deliberately omitted. The nominal balance changes only through deposits/withdrawals; inflation and FX still affect real purchasing power and USD value. The former real-rate/floor inputs and deposit-rate series are removed. This simplification may be revisited in a future model.

### 4.7 Market containers

- A `MarketPath` contains `Float64Array` fields `us_stocks, us_bonds, usd_cash, us_cpi, us_home, cn_cpi, cny_rate` of length T, plus `fx` and the US/China/medical price indices of length T+1.
- `generateMarketPath(scenario, reference, pathId)` regenerates the same path from its indexed streams. Workers keep path/chunk workspaces bounded; they do not require an in-memory object holding every path's full market arrays.
- Aggregate market bands and calibration summaries in workers. Selected-path replay includes the full market arrays for ledger verification. Chart buffers use explicit path/year/field indexing and a versioned field order.

---

## 5. Household model

### 5.0 Money convention: amounts are in starting-year purchasing power

| Input | Price treatment |
|---|---|
| Ordinary CNY budget and CNY one-time items | China price index |
| USD one-time items, rent, property insurance and HOA | US price index |
| Aggregate medical base, shocks and late-life care | Medical price index; additional configured real growth as below |
| Property tax | Its property-value growth cap rule |

Balances, cost basis, property value, depreciation, mortgage balance and FX quota start at their entered nominal values. Mortgage payments stay fixed. Tax tables follow §6.8 indexing. A monthly care amount entered today is inflated from `start_year`, including years before care starts.

### 5.1 People and fixed lifetimes

People contain required `A`, optional `B` (absent for a one-person household), and household `domicile` (`US|China`). Each person has `birth_year`, optional descriptive `sex` (`F|M`), `us_citizen` and `us_income_tax_status`. Age is `year − birth_year`.

Everyone remains alive until the younger (or the single person) reaches `simulation.max_age`, inclusive. There is no Gompertz mode/dispersion, death age, mortality draw or death transition. The older person's age may exceed Max age. This policy is common to all configurations and recorded as `both-alive-to-younger-max-age` in the run manifest.

### 5.2 Budget spending

Budget is the single source of the initial annual included amount, denominated in household currency (USD for US domicile, CNY for China domicile) and inflated by the domicile price index (`usd_index` for US, `home_index` for China):

```text
ordinary_base = annual − included_health
ordinary[t] = ordinary_base × domicile_index[t]
```

Require `0 ≤ included_health ≤ annual`. The medical base is counted once (§5.3), so 250,000 with 38,000 health means 212,000 ordinary plus 38,000 base medical at t=0.

There is no `spending[]` list, recurring item age window, survivor factor or `spending_rule`. Configured one-time expenses remain separate and retain their included/additional scope and currency-specific index.

Every budget uses initial treatment: `annual` states the first-year included budget; medical growth can change its future real cost. There is no budget mode and no ceiling-excess report.

Additional costs are funded and reported in actual total expenses but are excluded from included consumption. Late-life care is always additional. Shocks and one-time expenses retain their own scope controls.

### 5.3 Medical costs and continuing late-life care

`budget.included_health` is one aggregate starting-year medical base for the couple, in household currency. There is no People medical-base field or second annual medical amount.

```text
base[t] = included_health × (1 + medical.age_growth)^t × domicile_medical_index[t]
home_medical_index[t+1] = home_medical_index[t] × (1 + home_cpi[t] + medical_excess_inflation)
usd_medical_index[t+1] = usd_medical_index[t] × (1 + us_cpi[t] + medical_excess_inflation)
```

At 4% home CPI, 2% medical excess inflation and 4% age growth, combined nominal growth is 10.24%; real growth against home CPI is 6%. Report this combined assumption rather than describing it as 4% medical growth.

Each person has independently indexed occurrence and size draws. The shock probability at their age is `min(1, shock_prob_at_60 × 2^((age−60)/shock_prob_doubling_years))`. A realized shock is `shock_median × exp(shock_sigma_log × Z) × domicile_medical_index[t]`. Draws exist even when shocks are disabled; a disabled shock contributes zero. The configured shock scope affects only the included-budget report, not funding.

Late-life care lives under `[medical.late_life_care]`:

| Field | Meaning |
|---|---|
| `enabled` | Include the care expense; default false |
| `start_age` | First age at which care applies |
| `age_of` | Person A or B whose age triggers care |
| `monthly` | Aggregate monthly care amount in starting-year household currency |
| `real_growth` | Annual growth in addition to the medical price index; default 0 |

```text
care[t] = monthly × 12 × domicile_medical_index[t] × (1 + real_growth)^t
```

Care is zero before the selected person reaches `start_age`, then continues through the final simulation year. It is **always additional**: add it to Medical, total spending, funding needs and `additional_consumption_cny`; exclude it from `included_consumption_cny`. There is no end age or care budget-scope field. The configured amount is charged once, not multiplied by the number of people.

`medical_total = base + shock_A + shock_B + care`. Selected-year provenance shows base, shocks and care separately. Default disabled care hides its subordinate controls; the shipped sample explicitly enables an illustrative RMB8,000/month starting at A's age 85.

### 5.4 Social Security exclusion

Social Security is excluded from the entire simulation: no benefits are ever paid, no configuration carries Social Security inputs, and legacy values are discarded on import. Benefit amounts are zero in every row, including the frozen ledger `ss_usd` column.

There are no survivor eligibility/amount/claim controls or benefit transitions; everyone remains alive. The income-tax treatment of Social Security benefits stays in the tax code for frozen-oracle compatibility but always operates on zero.

### 5.5 Accounts and fixed income treatment

Account fields are `name`, `type`, `owner`, `share_A`, `balance`, brokerage-only `cost_basis`, `allocation`, Cash-USD-only `interest_rate` and pre-tax-only `rule_of_55`.

There are no per-asset income settings. Brokerage income is fixed by asset: `us_stocks` earnings at the configured dividend yield are qualified dividends, `us_bonds` earnings at the configured bond yield are coupon interest, and `usd_cash` earns its full market return as money-market interest. Bond sales realize zero gain (held to maturity). All income is US source.

Adding an account shows allocation fields for brokerage/pre-tax/after-tax, an interest-rate field for Cash USD, and neither for Cash CNY. Cash USD earns its configured rate or the observed 3-month T-bill return as ordinary interest; withdrawals return already-taxed cash with no gain. Wrapper changes retain allocation between brokerage/pre-tax/after-tax; switching to or from cash accounts drops it.

Taxable income classification remains independent of economic return exposure. Pre-tax/after-tax wrapper rules govern annual income and withdrawals instead; CNY deposits earn deliberately zero interest. Estate situs and retirement-wrapper estate fields are removed.

Legacy import drops retired holding maps/links and maps the retired taxable type to brokerage. New exports contain no holding declarations.

| Type | Currency / treatment |
|---|---|
| `brokerage` | USD; fixed-by-asset income, average-cost gains on stock/cash sales/rebalancing; bond sales zero-gain |
| `cash_usd` | USD deposit; configured or T-bill ordinary interest, gain-free withdrawals |
| `cash_cny` | CNY deposit; interest deliberately omitted (§4.6); deposits/withdrawals and FX/inflation valuation remain |
| `pre_tax` | USD; own distributions follow owner-specific tax/access/RMD rules |
| `after_tax` | USD; US exemption and configured China pension treatment |

Joint ownership is supported only for brokerage and cash accounts. Ownership shares remain fixed throughout the run and drive income attribution. Initial taxable basis is allocated by asset weights. Reinvested taxable income increases basis; year-end rebalance can realize taxable gains. There are no inheritance transfers or basis step-ups.

### 5.6 Access ages and RMDs

- **When `pre_tax`/`after_tax` can be withdrawn:**
  - from the year the owner turns 60 (a conservative stand-in for 59½);
  - from 55 if `rule_of_55` is set (`trad` only);
  - at any age if `withdrawals.allow_early_trad` is set. A 10% penalty then applies to `trad` before 60. Early Roth withdrawals are never allowed.
- **RMDs.**
  - They come from `pre_tax`, starting in the year the owner reaches 73 (born 1951–1959) or 75 (born 1960 or later).
  - Each year's amount = prior year-end balance ÷ the Uniform Lifetime divisor for that age (§6.8).
  - RMD cash covers needs first. Any excess is deposited into `withdrawals.surplus_account`.

### 5.7 Withdrawals and FX conversion

- **Need.** Each year, need = expenses − income, tracked separately in CNY and USD.
  - USD income first covers USD expenses.
  - Any USD left over is converted to cover CNY needs at `S[t]·(1 − fx_spread)`.
- **Surplus.** Whatever remains after that is deposited into `surplus_account`.
- **Shortfall:** walk through `withdrawals.order`, which must list every account exactly once:
  - `cash_cny` pays CNY needs directly, with no spread. It can also pay USD needs, at `S[t]·(1 + fx_spread)` CNY per USD.
  - USD accounts pay USD needs directly. A CNY need costs `cny / (S[t]·(1 − fx_spread))` USD. Default `fx_spread` = 0.003.
  - Accounts that can't be accessed yet are skipped. A brokerage account sells across asset classes in proportion to balances, realizing gains except on bonds.
- **Still short:** if `last_resort_property_sale` is set, attempt remaining properties in order, using proceeds after closing costs and mortgage payoff (§5.8). An infeasible sale does not create proceeds.
- **Still short:** record `shortfall_cny`. The path is **depleted** from its first shortfall year.
- **FX quota flag.** A year is flagged when USD converted to CNY exceeds `fx_quota_usd_per_person × 2` (default 50,000). Above the quota, China's FX authority (SAFE) asks for documentation when converting.

### 5.8 Properties (US)

**Fields:** all properties are US properties.
- ownership and value: `id` (stable unique stream ID), `share_A, value, cost_basis, land_share (0.2), depreciation_taken`;
- mortgage: `mortgage_balance, mortgage_rate, mortgage_years_left`;
- rent and running costs: `rent_monthly, maintenance_annual, property_tax_annual, insurance_annual, hoa_monthly`;
- growth and noise: `rent_real_growth (0)`; appreciation is deterministic with no premium or idiosyncratic noise;
- sale costs: `selling_cost (0.06)`. No state tax is modeled;
- strategy: `strategy, sell_year, sell_liquid_years, proceeds_account`.

**Each year while held:**
- Gross rent = `12·rent_monthly·US index[t]·(1+rent_real_growth)^t`.
- Expenses = `maintenance_annual + property tax + insurance_annual·US index + 12·hoa_monthly·US index`.
  - Property tax starts at `property_tax_annual`.
  - Each year it grows with value growth, uncapped.
- **Mortgage:**
  - The annual payment is fixed, computed from balance, rate and years left.
  - Interest = rate × opening balance. The principal part reduces the balance.
- **Cash flow** = gross − expenses − mortgage payment.
- **Depreciation** is tracked per owner share:
  - The share's building basis = `cost_basis·(1−land_share)·share`.
  - Annual depreciation is that basis ÷ 27.5, until the share is fully depreciated. Depreciation already taken counts toward this.
- **Schedule E net income** = gross − expenses − interest − depreciation. Each owner's share goes into their income ledger, subject to the passive-loss rules in §6.2.

**Strategies.** Triggers are checked at the start of each year. Any trigger sells the whole property.

| `strategy` | Sells when |
|---|---|
| `hold` | No strategy sale; a last-resort sale is permitted only when `withdrawals.last_resort_property_sale = true` |
| `sell_year` | `year == sell_year` |
| `sell_when_liquid_below` | Liquid assets (USD-equivalent at `S[t]`) < `sell_liquid_years` × this year's expenses |

**Sale:**
- Costs = `selling_cost × value`.
- Each owner share's adjusted basis = basis − depreciation taken. Gain = share × (value − costs) − adjusted basis.
- All property gains use LTCG rates before capital netting; the §1250 25% bucket is intentionally not modeled. A net sale loss enters ordinary property income. There is no Section 1231 history or lookback. Property losses are not automatically securities-style capital losses (§6.2).
- Closing proceeds = value − costs − mortgage balance. There is no FIRPTA withholding: every sale assumes citizen ownership, so the full proceeds are available at closing.
- Cash available at closing = proceeds. Deposit that amount in `proceeds_account`.
- If closing cash is negative, quote the required closing contribution. Execute only if accessible funds can cover it using the normal withdrawal rules; record resulting gains/distributions. Otherwise record `sale_failed`, keep the property and mortgage, realize no gain, and continue the shortfall walk. No automatic bridge loan is assumed.
- Each owner's gain for China is computed in CNY: `(share·(value − costs) − adjusted basis)·S[t]`, converting the USD gain at the sale-year FX rate. Initial ownership/basis remains unchanged except for normal depreciation and sale.
- Suspended passive losses on the property are released.

**Acceptance example:** a $1M sale with a $700k mortgage and $60k costs leaves $240k at closing. For the user's no-sale scenario, set `hold` **and** `last_resort_property_sale = false`.

### 5.9 Planning-horizon memo

Ownership and alive status remain fixed. There are no final-death deductions, attribute expiry on death, survivor transfers, inherited accounts, basis step-ups or estate taxes.

At the end of the younger person's (or the single person's) Max age year, deduct leftover unpaid income tax once at ending FX (§6.7). Ending balances and this memorandum are recorded before returning the path summary. No extra spending year is added and an unpaid tax bill is never relabeled as cash paid.

### 5.10 Year loop (required order)

For each `t = 0 ... T−1`, using `year = start_year + t`:

1. Capture opening liquid USD/net worth CNY before this year's flows; both alive flags are 1.
2. Carry any leftover unpaid tax from the prior year into this year's payment pool.
3. Check property strategies and feasible closing contributions; record sale gains and withholding.
4. Collect rental cash and RMDs.
5. Calculate ordinary budget, aggregate medical base, shocks, continuing care, one-time expenses and included/additional totals.
6. Fund consumption. Pay US bills before computing the China credit; use accessible accounts and permitted last-resort sales, deposit surplus or record shortfall.
7. Apply financial/CNY-deposit/property returns; record taxable income and weighted financial return.
8. Rebalance and record taxable gains.
9. Compute current US/China income-tax bills and pay them the same year, iterating so tax-driven withdrawals are taxed too.
10. Value ending balances and write the ledger; on the last row, finalize the ending income-tax memorandum and summary.

Beginning-year withdrawals do not earn that year's return. This is the ten-phase sequence in `src/model/engine.ts`; there is no flex/death/estate phase.

### 5.11 Success, depletion and forced sale

A path is depleted from its first real funding shortfall; a residual at most 1e-6 is numerical zero (§6.5). Success is never depleted over the configured horizon. A forced sale is a permitted last-resort property sale.

Continue through all T years after depletion, reporting planned costs, funded amounts, remaining shortfalls and unpaid taxes. Ending income-tax deficit is a separate metric. Late-life care is funded as an additional expense in every applicable year.

---

## 6. Tax model

### 6.1 Income ledger

Each year the engine collects USD amounts for each person:

`interest_us, dividends, qualified_dividends, nra_dividends, nra_exempt_interest, cap_gain (net realized, may be negative), trad_own, trad_inherited, roth, early_trad, rental_net, rent_gross, ordinary_property_gain, ltcg_property, property_gain_cny, passive_released`

- Account income is split by ownership share. Property items are split by owner share.
- China's calculation converts at `S[t]`, except `property_gain_cny`, which is already in CNY.
- Property sale records retain owner, income year, proceeds, depreciation and gain character. There is no Section 1231 loss history; sale classification uses the §6.1 split directly before Schedule D netting.
- `CapitalNet` contains nonnegative `lt_gain`, `ordinary_loss_deduction` and `loss_carryforward`. Store capital-loss carryforwards as positive amounts, with long-term character in v1. Preserve the raw inputs; net outputs are not added to raw gains a second time.
- Per-member bills record final federal income tax; China bills are net of the same-year US credit. Leftover unpaid tax carries one scalar per currency and is memo-deducted at the terminal boundary.
- Fixed asset-class tax treatment is independent of the sampled market-return class (§5.5). Tax prepayment/refund cash flows are not taxable investment income.
- `dividends` is the total dividend income for China; resident qualified dividends and ordinary distributions are separate subsets for the US calculation. NRA classifications/source are retained separately. A fund distribution is not also interest; overlapping ledger views are never summed as separate income.

### 6.2 US: supported resident branch (Form 1040)

Select by declared `us_income_tax_status = "resident"`; v1 implements the citizen/resident combination in §1.2. A noncitizen resident configuration requires an implemented branch and credit/treaty rules before it can run.

A two-person household files **MFS throughout** because both remain alive; a one-person household files **Single**. No death changes the run filing status.

1. **Property character, then capital netting.** Apply the §6.1 property split to sale records; pass ordinary amounts to ordinary income. For the remaining all-long-term capital items, `net_total = cap_gain + ltcg_property − prior_loss_carryforward`.
   - If negative, set the preferential gain bucket to zero, deduct `min(−net_total, capital_loss_limit[filing_status])` from ordinary income, and carry the unused loss forward as a positive amount.
   - If positive, the whole net total is `lt_gain` at LTCG rates; the §1250 25% bucket is intentionally not modeled. There is no collectibles or short-term pool. No loss deduction/carry remains when this total is positive.
   - At zero, gain, deduction and carryforward are zero. Short-term/collectibles rules are deferred; raw gains must not be independently floored before netting.
2. **Rental income and passive losses.**
   - Positive `rental_net` first absorbs the person's suspended losses.
   - A negative `rental_net` is deductible only up to the special allowance. Under MFS the allowance is 0. Under Single it is `25,000 − 0.5·max(0, MAGI − 100,000)`, floored at 0. The rest is suspended.
   - Deduct permitted sale-related `passive_released` in its income year. There are no death-specific passive-loss deductions.
3. **Social Security removed.** No benefits, inputs or SS taxation exist; former worksheet rules are deleted, not zeroed.
4. **AGI** = ordinary income after the allowed capital-loss deduction + qualified dividends + `CapitalNet.lt_gain`. Ordinary income includes interest, ordinary fund distributions, `trad_own + trad_inherited`, allowed rental income and ordinary property amounts. Each net capital bucket is included once.
5. **Deduction** = standard deduction only. The 65+ add-on and senior deduction are removed.
6. **Taxable income:** TI = `max(0, AGI − deduction)`. Regular tax uses the statutory formula below.
7. **NIIT** = `0.038 · min(NII, max(0, MAGI − threshold))`.
    - Derive NII from eligible net investment income after the same capital/property netting and applicable deductions; floor the final NII at zero. Retirement distributions are not NII. Do not reuse a gross gain eliminated by a capital loss.
   - The threshold is 125,000 (MFS) or 200,000 (Single), and is not indexed.
8. **Early-withdrawal penalty** = `0.10 · early_trad`.
9. **US-side foreign tax credit is not implemented.** The separate China-side credit equals same-year eligible US-paid tax, capped at the China bill. The sample household is China domiciled; the sample does not assume China taxes A at zero. Cash CNY generates no interest by user instruction. These supported branches still require the broader cross-border source audit.

**Capital-gains rate formula** (IRC §1(h)(1)). QD = qualified dividends; LT = `CapitalNet.lt_gain` after netting. There is no §1250 bucket.

```
ANCG = min(TI, QD + LT);   base = TI − ANCG
gains = ltcg_rates[0] on ANCG up to ltcg_0_top, ltcg_rates[1] up to ltcg_15_top, ltcg_rates[2] above — ANCG stacked from base to TI
tax   = min(regular(TI), regular(base) + gains)
```

**Required example:** MFS, ordinary income $100k, long-term securities loss $20k and property gain $50k with $10k prior loss: net gain $20k, deduction $16,100, TI $103,900, income tax $16,170, loss carryforward $0.

### 6.3 US: supported nonresident branch (Form 1040-NR)

Select by `us_income_tax_status = "nonresident"`, with compatible citizenship and example treaty assumptions. Do not select from `us_citizen = false` alone.

- **Income not connected with a US business (FDAP):** taxed at flat rates with no deductions.
   - equity dividends: 10% under the example treaty assumption;
   - exempt interest: 0;
  - securities gains: 0;
  - `trad_own`: 0 (treaty Art. 17(1));
  - `roth`: 0;
  - No inherited account or distribution is generated in this fixed-lifetime model.
- **US business income (ECI, under the net-basis election):**
   - It covers `rental_net` under the supported passive rules, plus property income/gains after the §6.1 split.
  - TI has **no deduction**.
   - Tax uses the MFS schedule throughout and the §6.2 netting/rate procedure for ECI-eligible capital items. Do not import an untaxed non-ECI securities loss into this netting pool without a supported rule.
- **Additional treatment:**
  - No NIIT.
  - The 10% early penalty applies to `early_trad` here too. That's conservative, since whether the treaty covers the penalty is unverified.

**No FIRPTA withholding is modeled.** Sale-date proceeds carry no prepayment (§5.8). The seller's final federal liability is computed and paid the same year; there is no withholding to credit against it.

### 6.4 China IIT

China IIT applies every year when the household `domicile` is `"China"`, and never when it is `"US"` (the six-year reset is always taken).

| Item | China tax |
|---|---|
| Dividends, US interest | 20% |
| CNY bank-deposit interest | Exempt |
| Net realized securities gains | 20%, on gains ≥ 0, netted per year with no carryforward, using USD gain × `S[t]` |
| Rent | 20% × 80% of gross rent |
| Property gain (USD gain × sale-year FX) | 20%, if positive |
| `pre_tax` and `after_tax` distributions | Exempt: retirement distributions are not taxed in China |
| US Social Security | Exempt (treaty Art. 17(2): taxable only in the US) |

**Same-year credit against eligible US-paid tax.**

China due = `max(0, china_tax_before_credit − min(china_tax_before_credit, eligible_us_paid_usd × S[t]))`. Eligible US tax excludes tax attributable to China-exempt pension income; penalties never qualify. No vintages, carryforward, withholding allocation or refund adjustments exist.

**Required example:** China raw $15,360 with $8,066 eligible US-paid tax gives $7,294 due the same year.

- China uses a flat 20% rate with a rent deduction; there are no brackets and nothing is indexed.

**Six-year rule.** It needs one trip abroad longer than 30 days in at least one year out of every six. Model the trip's cost as a spending or one-time item if you like.

**What this means in practice.** One US dollar of dividends costs B 10% US tax + (20% − 10% credit) China tax = 20%. The same dividend costs A 0% or 15% US tax and 0 China tax.

### 6.5 Rounding and units

All tax functions take and return floats in the stated currency, with no rounding. Tests compare to 0.01.

Use Float64 throughout the engine. For funding/depletion and negative-balance decisions only, treat a residual with absolute value at most `1e-6` in its stated currency as numerical zero; retain raw tax arithmetic and investigate larger discrepancies. This prevents an exact-PV control from failing because of floating-point subtraction. It is a numerical policy, not a spending allowance. A real RMB0.01 shortfall must still be reported. Domain checks on returns, inflation, logarithms and indices remain strict and never use this tolerance to repair an invalid factor.

### 6.6 State tax

Removed. No state tax is modeled; the former property-rate input is rejected on import.

### 6.7 Ending income-tax memo

At the final horizon row, start with ending financial accounts plus property equity. Mortgage debt is already deducted in equity. Deduct leftover unpaid income tax once:

```text
signed_ending_assets_cny = assets_cny − unpaid_income_tax_cny
ending_assets_after_tax = max(0, signed_ending_assets_cny)
```

Use ending FX for USD items. Previously paid cash is already out of balances and is not deducted again. Leftover tax is normally sub-dollar fixpoint residue; larger leftovers mean real funding shortfalls.

This is a memorandum valuation, not an extra cash year. There is no decedent, beneficiary, inheritance, estate tax or mortality-based stop.

### 6.8 Tax tables (bundled default object, 2026 base year)

**Verification:** the original table snapshot is unverified. The subsequently checked 2025 Schedule D worksheet subset is documented separately (§6.9); it does not verify all table values or cross-border rules.

**US ordinary brackets.** Each value is the taxable income where that rate starts. The tables use rates `[0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37]`.

| | 10% | 12% | 22% | 24% | 32% | 35% | 37% |
|---|---|---|---|---|---|---|---|
| single | 0 | 12,400 | 50,400 | 105,700 | 201,775 | 256,225 | 640,600 |
| mfs | 0 | 12,400 | 50,400 | 105,700 | 201,775 | 256,225 | 384,350 |

- **Deductions:**
  - Standard deduction: single 16,100; MFS 16,100.
  - 65+ add-on: 1,650 if married, 2,050 if single.
  - Senior deduction: 6,000, last year 2028, phase-out 0.06 above 75,000 for single filers. MFS filers are ineligible.
- **Capital gains:**
  - Preferential rate array: `ltcg_rates = [0.0, 0.15, 0.20]`; exactly three rates in [0, 1]. Local overrides may set all three to zero for a tax-free arithmetic control.
  - Long-term thresholds: `ltcg_0_top` single and MFS 49,450; `ltcg_15_top` single 545,500, MFS 306,850.
  - Unrecaptured §1250 maximum: 0.25. `top_lt25`, the ordinary-rate ceiling in the capital-gains formula, is derived from the brackets rather than stored: 201,775 for single and MFS in 2026.
  - Capital-loss limit: single 3,000; MFS 1,500.
- **NIIT and Social Security:**
  - NIIT rate 0.038; threshold single 200,000, MFS 125,000.
  - Social Security base amounts: single 25,000 / 34,000; MFS (living with spouse) 0 / 0.
- **Passive allowance** 25,000, phasing out between 100,000 and 150,000; MFS living with spouse 0.
- **Other:** early-withdrawal penalty 0.10; depreciation period 27.5 years; RMD start age 73 (born 1951–1959) or 75 (born 1960 or later).
- **Uniform Lifetime divisors:** 72 27.4, 73 26.5, 74 25.5, 75 24.6, 76 23.7, 77 22.9, 78 22.0, 79 21.1, 80 20.2, 81 19.4, 82 18.5, 83 17.7, 84 16.8, 85 16.0, 86 15.2, 87 14.4, 88 13.7, 89 12.9, 90 12.2, 91 11.5, 92 10.8, 93 10.1, 94 9.5, 95 8.9, 96 8.4, 97 7.8, 98 7.3, 99 6.8, 100 6.4, 101 6.0, 102 5.6, 103 5.2, 104 4.9, 105 4.6, 106 4.3, 107 4.1, 108 3.9, 109 3.7, 110 3.5, 111 3.4, 112 3.3, 113 3.1, 114 3.0, 115 2.9, 116 2.8, 117 2.7, 118 2.5, 119 2.3, 120+ 2.0.
- **NRA rates:** dividends 0.10, interest 0, capital gains 0, own pension 0, Social Security 0.255. There is no inherited-IRA scenario setting.
The static reference snapshot retains the original estate table solely for frozen independent M00 arithmetic. It has no current field editor, accepted scenario override or financial calculation.

**China:**
- flat rate 0.20; rent deduction 0.20; annual basic deduction 60,000; FTC carryforward 5 years;
- comprehensive brackets, as [start, rate]: [0, .03], [36k, .10], [144k, .20], [300k, .25], [420k, .30], [660k, .35], [960k, .45].

**Indexing.**
- **Indexed by the path's US price index**, as a stand-in for chained CPI: US brackets (and therefore `top_lt25`), the standard deduction, the 65+ add-on, long-term gain thresholds.
- **Not indexed** (this is real bracket creep): the NIIT thresholds, Social Security base amounts, the passive allowance and its phase-out, the capital-loss limit, the senior deduction, and all China amounts.

**The bundled tax tables.**
- The tables live in the reviewed public reference object `src/reference/tax-tables.json`, with the equivalent TOML key layout below. The object is bundled with the app and has a version/hash; the runtime does not load a server-side tax configuration file.
- **No scenario overrides.** A `[tax_tables]` section in an upload is rejected as an unknown key. Every configuration runs on the same bundled tables, whose version/hash is recorded in the run manifest.

Equivalent TOML layout for the bundled default values (the abbreviated Uniform Lifetime example is not a complete runnable table):

```toml
base_year = 2026

[us]
rates = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37]
brackets = { single = [0, 12400, 50400, 105700, 201775, 256225, 640600], mfs = [0, 12400, 50400, 105700, 201775, 256225, 384350] }
std_deduction = { single = 16100, mfs = 16100 }
add_65 = { married = 1650, single = 2050 }
senior_deduction = { amount = 6000, last_year = 2028, phaseout_start_single = 75000, phaseout_rate = 0.06 }
ltcg_rates = [0.0, 0.15, 0.20]
ltcg_0_top = { single = 49450, mfs = 49450 }
ltcg_15_top = { single = 545500, mfs = 306850 }
unrecaptured_1250_max = 0.25
cap_loss_limit = { single = 3000, mfs = 1500 }
niit_rate = 0.038
niit_threshold = { single = 200000, mfs = 125000 }
ss_base = { single = [25000, 34000], mfs = [0, 0] }
passive_allowance = 25000
passive_phaseout = [100000, 150000]
early_penalty = 0.10
depreciation_years = 27.5
rmd_start_age = { before_1960 = 73, from_1960 = 75 }
uniform_lifetime = { 72 = 27.4, 73 = 26.5, 74 = 25.5 }   # …every age 72–120, values as listed above

[us.nra]
dividends = 0.10
interest = 0.0
cap_gains = 0.0
own_pension = 0.0
social_security = 0.255


[cn]
flat_rate = 0.20
rent_deduction = 0.20
basic_deduction = 60000
comprehensive = [[0, 0.03], [36000, 0.10], [144000, 0.20], [300000, 0.25], [420000, 0.30], [660000, 0.35], [960000, 0.45]]
ftc_carryforward_years = 5
```

### 6.9 Primary-source status and checked worksheet subset

The current public source registry is `src/reference/source-gates.json` (15 rows). Whole-rule legal acceptance remains unverified; it is reported separately and never controlled by a config checkbox. The original 18-row M00 registry in `verification/source-gates.json` remains archived without invented edition/date evidence.

The former scoped §1250 capital check is archived with the removed worksheet ordering; see `verification/archive/pre-tax-simplification/`.

- Supported all-long-term securities gains/losses and prior long-term capital-loss carryovers; current example-config sale/loss regression runs successfully.
- Short-term/collectibles and the broader cross-border tax audit remain OPEN. Section 1231 history and lookback are removed. The frozen broad `CAPITAL-PARTIAL` conditional oracle is still OPEN.

Other applicable source work includes US tables/passive/RMD rules, NRA treaty rules, and household China domicile/deposit/FTC rules. Historical estate/death/survivor rules have no current financial role.

All configurations share calculation/validation. Missing required values or unsupported combinations block Run; source status remains visible independently. A numeric PASS verifies arithmetic under its stated scope and does not upgrade all legal sources.

---

## 7. Outputs

### 7.1 Ledger and annual report

One full-precision row exists for each of the T years. The retained v1 core field order is:

`year, age_A, age_B, alive_A, alive_B, fx, home_index, usd_index, spend_plan_cny, spend_cny, medical_cny, medical_base_cny, medical_shock_cny, one_time_cny, included_consumption_cny, additional_consumption_cny, rent_cash_usd, rmd_usd, portfolio_return, withdraw_usd, withdraw_cny, convert_usd, tax_us_A, tax_us_B, tax_cn_A, tax_cn_B, liquid_usd, cny_cash_cny, property_equity_usd, net_worth_cny, net_worth_cny_real, liquid_cny_real, net_worth_usd_real, shortfall_cny, forced_sale, sale_failed, fx_quota_flag, spend_mult`

- Both alive flags stay 1 through the horizon; absent-person B uses the -1/0 sentinels. The former flex/estate/death/SS/state-tax/payment-credit slots are removed, not zero-filled.
- `spend_cny` is ordinary budget spending; `one_time_cny` is separate. Medical is the single Budget base plus each member's shocks and always-additional continuing care. Provenance contains `medical_detail.base_cny`, `shock_cny` and `late_life_care_cny`.
- Tax columns record this year's computed bills, paid the same year; China bills are net of the same-year US credit. Leftover unpaid tax is a terminal memo deduction from heirs, not a settlement.

Five reporting values accompany replay/CSV (`retire-ledger-report-v1`, 42 CSV columns):

| Field | Meaning |
|---|---|
| `starting_liquid_usd` | Opening liquid USD before current-year flows |
| `starting_net_worth_cny` | Opening nominal net worth at opening FX |
| `spend_excluding_medical_cny` | Ordinary budget plus one-time costs |
| `medical_total_cny` | Aggregate base, shocks and care |
| `annual_investment_return` | Balance-weighted financial return including zero-interest Cash CNY, measured after opening-year flows at opening FX; before tax/FX changes; property excluded |

A financial return with no invested capital is missing, not 0%. Cash CNY contributes its balance to the weight with zero interest. Its interest is deliberately omitted and may be restored later.

The UI rounds **all money values to integers**. FX, indices and ratios retain decimals; returns use percent formatting. Engine decisions, summary scalars, replay/provenance and CSV keep Float64 precision. The UI is not a rounded calculation path.

### 7.2 Summary metrics

Success is the share of all requested paths with no funding shortfall through T. Forced-sale probability, depletion-age quantiles/histogram, wealth/liquid bands, FX/CPI bands, lifetime net cash income taxes and ending liabilities/refunds/assets are separate outputs.

Everyone remains alive. Stopped paths contribute zero to subsequent wealth percentiles, so all N paths contribute to every year's cohort; the funded-through-year curve uses N throughout. There is no mortality survival estimate, flexible-spending curve or estate-tax card. Legacy ending-summary/export names use the §6.7 compatibility meanings, with death years −1 and estate tax 0.

Quantiles remove missing observations, sort ascending and interpolate at `h=(n−1)q` (Type 7). `[1,2,3,4]` gives p10=1.3, median=2.5 and p90=3.7. Empty cohorts produce no value. Monetary scalar KPIs use Float64; chart bands use compact Float32 visualization data. Representative paths are actual stably ranked paths, using `floor(q×(N−1))` for worst/p10/median.

CSV uses round-trip-safe numeric strings, identifies the immutable run/path/manifest/stop, retains all 59 fields and includes only simulated annual rows. Display rounding does not change exported values.

---

## 8. Browser web app

### 8.1 Local configuration entry and builder

Upload TOML or use the in-browser empty/example/household constructors. All inputs use the same strict normalization/validation; user files are never sent to a configuration service or automatically persisted. Download saves a draft; reload requires re-upload.

The builder covers all 214 current serialized fields, including conditional tax/reference/account controls. Simulation has only start year, path count, seed and Max age; Random seed buttons share the draft seed and draw a valid uint32.

Markets, inflation & FX contains three sections:

- **Markets:** history window/bootstrap, stock/bond income yields, unchanged joint historical US rows. A note states that Cash CNY interest is intentionally omitted and may be added later; its former rate/floor fields are removed.
- **Inflation:** China CPI and medical excess inflation; US CPI comes from historical rows.
- **FX:** spot/fair value, mode/drift/PPP/noise/trend/spread/quota.

People contain Person A (required) and Person B (optional), each with birth year, descriptive sex, citizenship and US income-tax status, plus one household US/China domicile. Social Security inputs are removed. Medical contains shocks and care; care has no end age/scope and is always additional. There is no recurring-spending/flex section or People medical-base field.

Numeric inputs preserve decimal text during typing, including `0.003` and signed values; finite-number/integer/range validation still controls Run. External config changes synchronize the editors.

Mouse-wheel gestures cannot step a focused numeric field or change its value; keyboard focus and edits remain intact. Each input has a plain-English explanation shared with the inventory, accessible through hover, focus or its info button. Popups remain inside the viewport, can be hovered and dismissed with Escape or an outside click, and do not mutate the draft. Editing a value closes help. Primitive lists provide help per input, including separate bracket threshold/rate cells; Run Paths/Seed and the TOML editor also have help.

Accounts show allocation, basis, interest-rate and access fields according to their type. There are no holding settings, Holding profiles navigation section or profile-name editor.

### 8.2 Runs and state

Prepare an immutable request and manifest, enforce client-memory preflight, run bounded workers, aggregate off the main thread, and show progress/cancel/errors. Draft edits, market refreshes and failed/canceled jobs never replace completed/pinned results. Replay uses the original completed run's references, not the current public bundle. An invalid generated factor fails the whole requested job.

### 8.3 Results and ledger

Show wealth/liquid/FX bands, funded-through-year curve, depletion histogram and income-tax/ending-asset/budget metrics. Replay one stable path and paginate its ledger; all money is integer display with full-precision downloadable provenance/CSV. Show the five annual report fields and the medical base/shock/care split.

### 8.4 Comparison and downloads

Pin one immutable baseline within the memory budget. Compatible versions/seed/timeline/property streams allow paired current-minus-baseline Float64 path differences and Type 7 quantiles; incompatible runs are labeled unpaired. Download draft/run/baseline TOML, scientific/execution manifests, comparison JSON and ledger CSV locally. Model v5 manifests record lifetime, zero-interest Cash-CNY and nonpositive-net-worth stopping policies.

### 8.5 Verification surface

The `/verification` development harness exposes actual product inputs/expected/actual/traces and worker controls. It is excluded from the production bundle. Automated numeric, unit, build, browser, privacy and performance evidence follows all original milestone IDs; no manual sign-off is required.

### 8.6 Public market refresh and portable references

**Refresh market data** is an explicit homepage action, available before loading a config. Fetch NYU annual returns/dividend data plus FRED `CPIAUCNS`, `FPCPITOTLZGCHN`, `DEXCHUS` and `DGS10`. A shared Node JS gateway at `GET api/market-data` downloads only these fixed public URLs; no request parameters, body, credentials, scenario files or user financial inputs are accepted. NYU/FRED currently lack browser CORS headers, so dev/preview/test hosts provide this gateway. Pure static hosts support market-package upload/download; their refresh button explains a missing endpoint instead of applying fallback data.

The shared collector backs `npm run data:fetch -- --output <directory>`. It checks exact NYU sheet/column headers, consecutive complete calendar years, FRED missing values, finite domains, income-rate definitions and source/package hashes. Fetch all five before applying any. Detect the latest complete US year dynamically; China/FX histories provide calibration references. On source, parser, package or network failure/cancellation, preserve current references and the latest edited draft. There is no automatic network refresh or browser persistence.

Apply the two income yields and latest spot FX to the current draft, retaining budgets, allocations, fair value and configured China/FX/medical risk parameters. Extend a sample end only if it matched the previous latest complete year; retain a deliberately narrower window. Show fetched/source observation dates, definitions, values and hashes.

The old 0.013/0.042 income assumptions had no dated source. The shipped replacement is NYU 2025 dividend yield `78.57 / 5881.63 = 0.01335854176478289` and FRED DGS10 2026-10-15 `5.10 / 100 = 0.051`. DGS10 is a 10-year Treasury **par-yield income proxy**, which may differ from an existing portfolio's coupon income. Both values split total returns rather than adding return. Their static example defaults retain their observation dates; the button obtains new values.

`retire-market-data-v1` packages contain annual US/China/FX rows, latest observations, income yields and raw source hashes. Their scientific content hash excludes retrieval timestamps; identical raw observations reproduce the same hash. Completed runs capture the whole package and include its hash in the manifest. Download the run's data package and TOML; upload the package before the TOML after reload to reproduce intentionally edited inputs. A refreshed or uploaded dataset never changes an earlier/pinned ledger. Updated source hashes make comparisons unpaired. Frozen shipped raw values and yields are independently reconciled using stdlib BIFF/CSV readers; runtime refresh validates shapes/hashes but does not claim an independent audit of future provider revisions.

---

## 9. Portable TOML configuration schema (illustrative example)

### 9.1 Complete exported example

The same in-browser constructor exports [examples/sample.toml](../examples/sample.toml). It starts in 2027 with both people born in 1986 and has a maximum 70-year horizon, ending earlier if net assets become nonpositive. Social Security is not modeled; optional care is explicitly enabled in this illustration.

```toml
# Local example input. US market data use NYU historical rows; China CPI/FX are modeled and legal sources are unverified.
one_time = []
schema_version = 1

[[accounts]]
balance = 300000
name = "cny_bank"
owner = "joint"
share_A = 0.5
type = "cash_cny"

[[accounts]]
balance = 1200000
cost_basis = 800000
name = "joint_brokerage"
owner = "joint"
share_A = 0.5
type = "brokerage"

[accounts.allocation]
us_bonds = 0.3
us_stocks = 0.6
usd_cash = 0.1

[[accounts]]
balance = 900000
name = "A_401k"
owner = "A"
rule_of_55 = false
share_A = 0.5
type = "pre_tax"

[accounts.allocation]
us_bonds = 0.4
us_stocks = 0.6
usd_cash = 0

[[accounts]]
balance = 300000
name = "B_401k"
owner = "B"
rule_of_55 = false
share_A = 0.5
type = "pre_tax"

[accounts.allocation]
us_bonds = 0.4
us_stocks = 0.6
usd_cash = 0

[[accounts]]
balance = 150000
name = "A_roth"
owner = "A"
share_A = 0.5
type = "after_tax"

[accounts.allocation]
us_bonds = 0
us_stocks = 1
usd_cash = 0

[budget]
annual_cny = 312000
included_health_cny = 36000

[market]
block_mean_years = 8
cn_cpi_mean = 0.017
cn_cpi_phi = 0.3
cn_cpi_sigma = 0.018
cn_cpi_start = 0.001
fx_adjust_speed = 0.15
fx_drift = 0
fx_fair_value = 6.692
fx_mode = "ppp"
fx_quota_usd_per_person = 50000
fx_real_trend = 0
fx_sigma = 0.042
fx_spot = 6.692
fx_spread = 0.003
income_yield_us_bonds = 0.051
income_yield_us_stocks = 0.01335854176478289
medical_excess_inflation = 0.02
sample_end = 2025
sample_start = 1928

[medical]
age_growth = 0.04
shock_budget_scope = "additional"
shock_enabled = true
shock_median_cny = 50000
shock_prob_at_60 = 0.02
shock_prob_doubling_years = 8
shock_sigma_log = 1

[medical.late_life_care]
age_of = "A"
enabled = true
monthly_cny = 8000
real_growth = 0
start_age = 85

[people]
domicile = "China"

[people.A]
birth_year = 1986
sex = "F"
us_citizen = true
us_income_tax_status = "resident"

[people.B]
birth_year = 1986
sex = "M"
us_citizen = false
us_income_tax_status = "nonresident"

[[properties]]
cost_basis = 600000
depreciation_taken = 150000
hoa_monthly = 0
id = "rental_1"
insurance_annual = 1500
land_share = 0.2
maintenance_annual = 12465.6
mortgage_balance = 0
mortgage_rate = 0
mortgage_years_left = 0
proceeds_account = "joint_brokerage"
property_tax_annual = 9000
rent_monthly = 3800
rent_real_growth = 0
sell_liquid_years = 0
sell_year = 0
selling_cost = 0.06
share_A = 0.5
state_tax_rate = 0.093
strategy = "hold"
value = 900000

[simulation]
max_age = 110
n_paths = 200
seed = 42
start_year = 2027

[withdrawals]
allow_early_trad = false
last_resort_property_sale = true
order = [ "cny_bank", "joint_brokerage", "A_401k", "B_401k", "A_roth" ]
surplus_account = "joint_brokerage"
```

---

### 9.2 Common validation and supported combinations

Local imports and the builder share `parseScenario`, `normalizeScenario` and `validateScenario`. A failed import preserves the current draft. Run snapshots a complete supported configuration; drafts with missing facts remain editable and downloadable when structurally valid.

- Root `schema_version=1`, uploads at most 2 MiB, strict known keys, finite numbers and safe integer fields. Versionless files are rejected. Unique nonempty property IDs and account names are required.
- Retired fields (Simulation metadata, mortality/survivor/estate fields, recurring-spending rules, People medical bases, care end/scope, CNY deposit rate/floor, holdings, per-person domicile, Section 1231 history, Social Security inputs, property name/vacancy/fee/cap/premium/noise/FIRPTA fields, tax and tax_tables sections, retired account type names) are rejected as unknown keys on import. There is no migration path; imports never mutate the supplied object or invent legal status.
- Every configuration uses the same required-input, reference, range and supported-tax-combination checks. Source status is reported independently; no `kind`, assumptions list, unresolved-input checklist or legal-verification checkbox affects calculations or Run.
- Citizen/resident and noncitizen/nonresident income branches are supported. A citizen cannot use NRA; noncitizen/resident is explicitly unsupported. Domicile is one household-level US/China selection. There are no estate inputs.
- Each start age is an integer in 18…100. Max age is an integer in 18…200 and at least the younger start age (or the single start age). The older person may exceed Max age; the inclusive fixed horizon must remain positive.
- Nonzero initial capital/passive/FTC/bill histories need a schema extension; examples assume zero initial histories.
- Allocations are required for brokerage/pre-tax/after-tax, sum to 1 within 1e-6, and are forbidden for cash accounts. Joint accounts are limited to brokerage and cash accounts. Cash CNY has no allocation and earns zero interest. Cash USD rate is optional and nonnegative. Retired holdings and account type names are rejected on import.
- Withdrawal order contains every account exactly once. Surplus/property-proceeds targets are brokerage accounts. Property hold and no last-resort sale together enforce no-sale behavior. Basis/loan/cost inputs remain required for possible sale treatment.
- Budget requires nonnegative annual/health amounts with health no larger than annual; both are single-source amounts. Care has enabled/start-age/selected-person/monthly-CNY/real-growth controls and is always additional. One-time/shock scopes remain valid enums. Growth/factor and money ranges are enforced.
- Social Security is not modeled: there are no inputs and no benefits are ever paid.
- Market window is within the active source history and at least ten years; bootstrap mean is at least one. Spot/fair value are positive; valid mode/drift/spread/noise ranges and generated factors are required. An inadmissible window or generated factor fails explicitly instead of clipping/resampling/dropping paths.
- There are no tax overrides: every configuration uses the same bundled reference tables.
- Integer path count is 1…100,000 and seed 0…4,294,967,295. Client-memory preflight includes pinned results and can reject a requested size without changing N.

All 87 current paths and omission/default rules are in the generated [field matrix](../verification/config-field-matrix.md). Numeric text precision is retained while editing; invalid incomplete/nonfinite numeric entries block Run rather than quietly using a default.

### 9.3 Household draft and independent 50-payment control

`src/config/constructors.ts` creates empty, sample, control and household drafts in the browser. No constructor reads a server-side user configuration. The separate household draft preserves $5.3M gross financial assets ($1.7M cash equivalents, $2M investments, $1.6M retirement), $2M property/$731k loans, user-selected FX 6.69 and RMB250,000 annual budget including RMB38,000 medical.

It leaves required account bases/ownership/allocation/retirement split, property cash/tax/loan details and B's retained-green-card income status incomplete. China domicile and medical/shock/care choices need adopted factual inputs. Actual unsupported resident-alien income tax cannot run as NRA. Source status remains separate from factual validation.

The development-only deterministic control supplies literal return rows via `verification/market-tapes.ts` and starts in 2026, both born in 1986, with **Max age 89**, hence exactly 50 beginning-year payments at ages 40…89. Both remain alive. It uses constant 3% nominal pre-personal-tax return, 4% China CPI, 3% US CPI, FX 6.69, zero spread/tax rates and disabled SS/shocks/care/property noise. The single health base is RMB38,000 with zero age growth/medical excess, so ordinary RMB212,000 plus health remains exactly RMB250,000 × China index.

```text
First payment = 250,000 / 6.69 = USD 37,369.20777279521
PV = sum(t=0…49) (250,000 / 6.69) × (1.04 / 1.03)^t
   = USD 2,390,572.9770677146
```

The separate 1% annual RMB-appreciation control uses `fx_drift=log(.99)` and has PV USD3,152,520.3411145047. Add tax/access, FX, medical growth/care/shocks and return variation separately when interpreting sensitivities; Cash CNY interest remains deliberately zero in every scenario.

Observed dot-com/2008 replay requires actual documented annual stock/bond/cash rows and the stated allocation. Amplified stress is labeled separately; a peak-to-trough equity fall is not a one-year diversified-portfolio calendar return. These arithmetic controls do not establish a household funding floor.

### 9.4 Current contracts and frozen M00 evidence

The [verification package](../verification/README.md) maintains current declarations and the 190-field mapping, with the original 80-case oracle catalog/raw M00 reports unchanged. These are development assets excluded from production.

- `retire-canonical-v1`: recursively sorted ordinal UTF-16 object keys, preserved array/string order, finite JSON numbers, omitted undefined object leaves, rejected undefined array elements; SHA-256 of unindented UTF-8 canonical bytes.
- `retire-rng-v1` / `retire-draws-v2`: stable bootstrap/CPI/FX/medical/property streams over T, no mortality stream. Switches or financial decisions do not change draw consumption; property IDs and path prefixes are stable.
- `retire-model-v5.1`: everyone alive to the younger (or single) Max age, single-source Budget medical, continuing always-additional care, zero-interest Cash CNY, direct historical rows and nonpositive-net-worth stopping. The manifest records lifetime, Cash-CNY and stopping policies.
- `retire-results-v1`: 37 retained core ledger fields, seven chart buffer fields and 17 Float64/5 Int32/3 Uint8 scalar fields (159 summary bytes/path). Former flex/estate/death/SS/state-tax/payment-credit slots are removed; alive flags remain. `retire-ledger-report-v1` adds five replay/CSV fields.
- N=20,000/T=52 retains exactly 32,300,000 bytes; the shipped N=200/T=70 example retains 423,800 bytes. The explicit performance fixture uses T=52. The 512 MiB preflight budgets modeled allocations/reserve, not OS browser RSS.
- Independent reference arithmetic recomputes all 55 original numeric answers. Current product comparison applies 18 numeric cases, retires 37 obsolete cases and explicitly excludes the original deposit-rate and FX-stress subfields from `MARKET-TIMING`. Current units/browser tests cover replacement requirements without rewriting golden answers.
- Original [control workbook](../verification/records/M00-2/control-calculations.xlsx), raw fixtures and preparation notes stay archived. Current reports are indexed separately; a retired case is not labeled PASS.

---

## 10. Environment and dependencies

**Status:** JavaScript dependencies and browser benchmarks have not been verified or installed by this documentation change. Record actual versions during implementation.

| Area | Choice |
|---|---|
| Development runtime | Node.js 24 LTS and npm; verify compatibility with the selected Vite/package versions |
| Web app | React, React DOM, TypeScript, Vite; strict TypeScript settings and module Web Workers |
| Configuration | `smol-toml`, Zod; one parse/normalize/validate/export pipeline |
| Deterministic hashing | `@noble/hashes` SHA-256 for stream seeding/canonical hashes; no runtime `Math.random()` in the model |
| Charts | ECharts, wrapped by small React components |
| Verification | Vitest for model tests; React Testing Library for relevant UI state; Playwright for browser regression flows; `tsx` for development scripts |
| Source workbooks | Development-only Node BIFF `.xls` reader, selected/pinned after a real-workbook compatibility check (§4.1) |

- Pin verified dependencies in `package-lock.json`; document Node/npm/browser versions. A fresh `npm ci` must reproduce the build. No dependency version or laptop benchmark is assumed passed from the previous environment.
- Primary commands: `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`, `npm run preview`. Development verification uses `npm run verify -- --case <ID>` and `npm run verify -- --all`; data work uses `npm run data:fetch -- --output <directory>`, `npm run data:import -- --source-dir <local-directory>`, `npm run data:bundle`, and `npm run data:verify`. Each script is created at its plan milestone.
- `dev` serves the builder and a development-only `/verification` harness. `build` produces `dist/` with the product interface and compiled app/worker/public-reference assets; fixture inputs, raw source workbooks and acceptance records are excluded. `preview` serves that static build for automated browser acceptance. End users need a supported browser, not Node.
- Initial support/acceptance browsers are current stable desktop Chrome and Safari on the named Apple M4 Pro. Record their exact versions and available memory. Use HTTPS or localhost; do not require users to launch the app from `file://`. Test module-worker asset paths in the production build.
- Default worker count is `min(4, max(1, (navigator.hardwareConcurrency || 2) - 1))`. Verification can set 1 or 4 workers and chunk size without changing the financial configuration. Memory preflight includes retained results and temporary aggregation storage; 100,000 paths remain an allowed input when the declared resource budget supports them.
- The static host needs no user-configuration files, environment secrets, user database or simulation service. Configuration uploads/downloads and computation stay in the browser. Load worker/reference assets before testing computation with the network disabled; initial app loading still needs available assets (§4.1).
- Development source acquisition uses downloaded local files and records provenance. Any needed trusted-CA setup belongs to development tooling; it is not a browser/runtime requirement. Raw workbook contents are verified before generating the bundled references.
- Commit public reference data/manifests, source-verification records, lockfile and fixture oracles. Ignore dependencies, build output, local raw downloads, personal configuration exports and private acceptance artifacts. Existing environment directories are unrelated to the web-app runtime.

---

## 11. Testing

### 11.1 Hand-checked tax cases

The original independently calculated table is retained below. EST-1/2/3, MORT-1 and DEATH-1/2 are historical **RETIRED** cases under the fixed-lifetime model. TERMINAL-1 is RETIRED with the settlement mechanics; current same-year payment is pinned by engine unit literals instead. Current execution classifications are in `records/product-cases.json`; no archived death/estate/mortality/timing calculation is a current feature.


These use the spec's 2026 tables with the price index at 1.0. The original arithmetic cases were recomputed during design; the review counterexamples were independently recalculated on 2026-10-18. Arithmetic checks do not certify the legal tables/rules. Cases depending on an unverified legal interpretation require the corresponding §6.9 source check before being accepted as legal regression cases.

| ID | Inputs | Expected |
|---|---|---|
| US-1 | A, MFS, age 70, year 2027: trad 80,000; QD 10,000; SS 30,000 | taxable SS 25,500; deduction 17,750; TI 97,750; income tax **15,517.00**; NIIT 0 |
| US-2 | A, Single, age 70, year 2027: trad 50,000; SS 40,000; LTCG 20,000 | taxable SS 34,000; deduction 22,410 (16,100 + 2,050 + senior 4,260); TI 81,590; tax **11,261.80**; NIIT 0 |
| US-3 | A, MFS, age 60: interest 5,000; QD 30,000; LTCG 150,000 | TI 168,900; tax **17,917.50**; NIIT **2,280.00** |
| US-4 | A, MFS, age 66: trad 60,000; property u1250 50,000; property LTCG 100,000 | TI 192,250; tax **30,007.00**; NIIT **3,230.00** |
| US-5 | A, MFS, age 60: trad 150,000; property u1250 40,000 | TI 173,900; tax **34,334.00** (the formula and regular tax agree; the gain sits in the 24% bracket); NIIT **1,520.00** |
| US-6 | A, MFS, age 60: trad 250,000; property u1250 50,000 | TI 283,900; tax **63,804.00** (the 25% cap binds; regular tax would be 68,134.25); NIIT **1,900.00** |
| NRA-1 | B, MFS schedule: rental_net 20,000; dividends 10,000; SS 20,000 | 2,152 + 1,000 + 5,100 = **8,252.00** |
| CN-1 | B: dividends 50,000 CNY; gross rent 200,000; trad 300,000 (comprehensive); **eligible, finalized and paid** US income tax 20,000 CNY | China tax before credit 10,000 + 32,000 + 31,080 = 73,080; credit 20,000; due **53,080.00** |
| EST-1 | Tentative tax T(1,000,000); T(60,000) | **345,800**; **13,000** |
| EST-2 | NRA with 2,000,000 US-situs, no citizen spouse | **732,800** |
| EST-3 | Citizen with gross estate 16,000,000, exclusion 15,000,000 | **400,000** |
| RMD-1 | 1,000,000 at age 75 | **40,650.41** |
| MORT-1 | Gompertz life expectancy at 65: (88, 9.5) and (91, 8.5) | **20.05**, **22.52**, each ± 0.05 (numerical integration) |
| US-7 (R1) | MFS age 60: ordinary income 100,000; current LT securities loss 50,000; capital-treatment gross §1250 gain 50,000; no prior Section 1231 complication | Net gain 0; TI **83,900**; regular tax **13,170**; capital-loss carryforward 0 |
| US-8 (R1) | Same ordinary income; LT loss 50,000 and gross §1250 gain 20,000 | Net loss 30,000; deduction 1,500; carryforward **28,500**; TI 82,400; regular tax **12,840** |
| FIRPTA-1 (R2) | Sole foreign seller, applicable 15% rate; price 1M, mortgage 700k, costs 60k; final federal liability 20k | Closing cash **90k**; prepayment 150k; next-year refund **130k**; permanent tax 20k; no second charge |
| DEATH-1 (R3) | Suspended passive loss 30k; relevant basis increase 20k | Final-return permitted deduction **10k**, prepared before tax |
| DEATH-2 (R3) | Suspended loss 30k; relevant basis increase 50k | Permitted deduction **0**, not a full loss release |
| TERMINAL-1 (R3) | Assets 500k USD; unpaid final income tax 30k; no other tax/liability/prepayment | Net to heirs **470k** before beneficiary income tax; actual tax-paid fields unchanged by the memo settlement |
| CN-2 (R4) | Unit-FX/USD-equivalent case: dividends 50k, US eligible dividend tax 5k; SS tax 5.1k on China-exempt SS; both paid | China dividend tax before credit 10k; eligible credit **5k**, due **5k**, subject to legal eligibility verification |

Also pin partial capital offsets and prior carryover ordering to the applicable worksheets; property sale classification to the supported split; FTC excess, expiry, refund and partial-payment allocation to the confirmed rules. Include final-horizon taxable sales/distributions, unpaid prior bills and refundable prepayments. No test should assume that every US tax component is creditable.

### 11.2 Market realism checks

Raw NYU/FRED rows, population calibration, observed calendar crisis tapes and production-worker source identity are now checked independently. The broader empirical Monte Carlo expectations below remain OPEN until separately reproduced; they are not inferred from raw-source acceptance.


Defaults, N = 20,000, T = 40, fixed seed. Reproduce §4's provisional references from versioned data before finalizing statistical tolerances. Structural/domain checks below are independent of those provisional measurements.

- Mean simulated `us_stocks` is within ±0.3 percentage points (pp) of 11.85%; `us_bonds` within ±0.2 pp of 4.82%.
- Source fidelity: every selected US row remains unchanged in all configurations, including negative 2000–2002/2008/2022 returns; bounds follow the selected window.
- Removed projection/event fields never appear in current exports and cannot change any path when present in a correctly typed legacy upload.
- Domain failures reject invalid CPI/medical/combined-property factors before logs or balances; invalid full-horizon Gaussian market draws fail the whole job. No resampling or partial probability output.
- **FX drift mode.** With `fx_sigma = 0` and `fx_drift = −0.01`, `S[t] = fx_spot·e^{−0.01·t}` within 1e-12.
- P(nominal bond max drawdown > 35%) < 0.005, and P(> 50%) < 0.0005.
- China CPI: mean 1.7% ± 0.1 pp, SD 1.89% ± 0.1 pp, lag-1 autocorrelation 0.30 ± 0.03.
- FX: the SD of annual log changes lies in [4.4%, 5.1%].
  - Deterministic case: `fx_sigma = 0` with constant inflation (US 3%, China 1%). Then `log S − log P` converges to `−(1−λ)/λ·log(1.01/1.03)` within 0.002 by t = 60.

### 11.3 Current automated verification

- **Configuration/UI:** local UTF-8 upload/export/re-upload, strict unknown/finite/integer errors, missing/unsupported actual fields, random seed endpoints, all current fields, conditional SS/care controls and Markets/Inflation/FX grouping. Typed `0.003` survives editing/export/run; external loads synchronize numbers. Cash CNY rate/floor are absent and the intentional-omission note is visible.
- **Fixed horizon:** different ages/seeds produce at most T rows, everyone alive throughout; solvent paths end at the younger (or single) Max age and exhausted paths stop earlier; the older can exceed it. Removed death/estate/flex fields never reappear in current exports.
- **Medical:** RMB212,000 ordinary + RMB38,000 aggregate health once; combined price/age growth and shock scope; care starts at selected age, continues through the horizon, is funded/shown in Medical and always enters additional consumption rather than included consumption.
- **Accounts/tax:** average basis/reinvestment/rebalance, access/RMD/FX journals, zero CNY-deposit interest/income despite inflation/FX changes, checked IRS long-term §1250 loss/carryover cases, early penalties, pending tax/payment/refund/China FTC provenance.
- **Property:** mortgage/depreciation/rental cash, feasible sales/withholding/refunds, sale failure and hold/no-last-resort-sale. No inheritance or basis step-up event exists.
- **Engine:** test-only full 50-row PV/FX controls, early zero/negative net-worth stops (including empty initial portfolios), accessible-asset shortfalls with positive property equity, final/current/prior income taxes and confirmed refunds counted once. Ending USD500k−24734=475266, prior pre-tax funding=474402.6 and citizen-sale 240000−7582.5=232417.5 literal controls use bundled reference rates with no overrides and no withholding.
- **Workers/results:** seeded prefix/schedule/property-ID reproducibility, real transfers, Float64 Type 7 KPIs/comparison, stable ranking, whole-N funded cohorts, full-precision replay/59-column CSV with integer money display, cancellation/stale messages and whole-job factor failure.
- **Browser workflow:** sample upload/build/edit → real workers → results → pin/paired comparison → ledger/export → reload/re-upload; fresh loaded offline runs, local files/no config requests or storage, static directory mounts and production harness exclusion.
- **Resources:** explicit T=52 benchmark, genuine three warm runs each at 2,000/20,000 paths (10s/90s gates), 37.42 MB retained arrays and measured browser RSS. Check tab/input responsiveness and cancellation; reject oversized N/T/baseline combinations without lowering N. Ordinary sample T=70 is separate.

Frozen M00 reference arithmetic remains independent of `src/model`. Twelve superseded numeric cases are RETIRED; seven broader source/data cases are OPEN and 18 structural cases are labeled SUITE by the numeric CLI. The checked §1250 subset has additional authoritative unit/browser evidence.

### 11.4 Automated milestone acceptance

Follow [the implementation plan](2026-10-18-retirement-sim.md) in M00–M11 dependency order. Each step defines outputs, independent numeric/UI/network assertions and machine-readable evidence. Mark a step complete only when its automated criteria pass for the recorded build. No human checklist or signature is required. Failed financial checks block dependent integration; missing facts and unsupported tax branches block every configuration. Legal/history source status stays explicit in all runs and exports without a category-dependent execution gate. Observed NYU/FRED data exercises the shared workflow; independent raw-source/calibration and calendar 2000–2002/2008/2022 replay checks pass. Broader empirical calibration and primary legal-source scope remain separately OPEN. Current scope and test coverage are reported in [implementation status](../verification/implementation-status.md).

Implementation acceptance uses `npm run check` and the reports in `verification/records/`. Product case reports show actual model intermediates against frozen literal oracles; structural browser cases are not marked PASS by the numeric CLI. The complete user-facing sample workflow includes local upload/build, worker computation, paired comparison, Float64 ledger/export, reload/re-upload, fresh offline workers and a static directory mount. Worker code is bundled into the initial assets; no simulation/configuration request or server scenario file is required.

Ordinary Chromium child-process launch and WebKit currently fail before app load on the execution host. Chromium testing uses a recorded single-process workaround; Safari/cross-browser acceptance stays OPEN. This limitation does not certify unavailable browser checks, historical rows, primary legal sources or the actual retained-green-card tax branch.

## 12. Model conventions and deliberate simplifications

| Convention | Consequence / possible extension |
|---|---|
| Everyone lives to the younger (or single) Max age, inclusive | Full fixed-horizon funding; no mortality, survivor, inheritance or estate model |
| Cash CNY earns zero interest intentionally | Only deposits/withdrawals change nominal balance; FX/inflation valuation remains; interest may be added back later |
| Single aggregate Budget medical base | No duplicate per-person base; configured medical age/price growth can raise real spending |
| Care always additional from selected age through final year | Included consumption does not absorb care; medical/total/funding still include it |
| Annual beginning-year flows / following-year income-tax settlement | Withdrawal capital earns no current-year return; pending bills/refunds survive the final horizon |
| Constant stock/bond income yields; reinvestment | Taxable income decomposition uses declared yields rather than historical distribution columns |
| All securities gains long-term; average basis | Short-term/lot/wash-sale modeling is deferred; property sales use the simple unrecaptured-§1250/LTCG split |
| Unchanged observed US history / Gaussian China CPI and FX | All configurations use historical returns, without a 3% target; China/FX source histories supply calibration references; invalid factors fail whole runs |
| Supported citizen/resident and noncitizen/nonresident income branches | Actual retained-green-card resident-alien/treaty-residency work remains unsupported |
| Social Security excluded | No benefits, inputs, earnings-history/claim optimizer or survivor entitlement |
| China gain conversion / CPI tax-table indexing / property-only state tax | Original simplifying accounting policies remain disclosed and source-gated |
| No conservative credit for unpaid source tax at final horizon | Conditional entitlement is disclosed separately; confirmed refunds recognized once |
| Float64 calculations/scalars; Float32 chart series | Display/chart precision does not determine taxes, depletion or full-precision CSV |
| Static local app and in-memory sessions | Users save with downloads and re-upload after reload; client resources limit scale |

---

## 13. Risks and open acceptance

- Actual household account ownership/bases/retirement access, rental/loan/tax inputs and medical amounts still need factual completion. B's retained-green-card resident-alien income branch is not implemented.
- The broad primary-source audit and applicable cross-border payment/FTC/benefit rules remain OPEN. Checked §1250 worksheet evidence does not certify the whole tax model.
- Raw NYU/FRED history, population calibration and actual dot-com/2008/2022 calendar tapes are checked. Broader empirical Monte Carlo distribution targets remain OPEN; historical averages do not enforce a conservative 3% return assumption.
- Chromium verification uses this host's single-process launch workaround. Ordinary browser child-process/WebKit launch fails before app load here; Safari/cross-browser acceptance remains OPEN.
- Resource preflight estimates known allocations, not an OS process-memory cap. Actual measurements and supported scope are in the release/milestone reports.

These items do not create a Simulation metadata gate. Required financial fields and supported combinations govern Run for every configuration; source status is reported separately.
