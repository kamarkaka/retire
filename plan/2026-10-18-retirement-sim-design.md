# Retirement Monte Carlo Simulator: Design Spec

- **Date:** 2026-10-18
- **Status:** Browser web app with server-managed public market data, implemented through the M00–M11 software steps and extended by releases 0.1.0–0.6.0 ([changelog](../CHANGELOG.md)). Human milestone sign-offs are retired by user instruction; `npm run check` is the automated gate, comparing applicable cases with the independent M00 oracles while superseded cases stay explicitly retired. Financial corrections, common input validation and source status remain explicit (§6.9, §9.2, §13). The revision log records decisions as they were made; the sections after it describe the code as of revision 47.
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

37. **Historical rows for all configurations:** remove Custom return/US-inflation controls and FX stress events, including their rescaling/event logic. Recognized legacy fields are discarded on import; invalid legacy types still fail.
38. **Repeatable market refresh:** the homepage button fetches five fixed public NYU/FRED sources, validates one complete data package and applies history, income yields and spot FX atomically. Configurations remain browser-only; completed/pinned runs retain their original reference snapshot. Upload/download market data packages support static hosting and reproducible runs.
39. **Stop at nonpositive net assets:** financial paths stop at the inclusive younger-Max-age horizon (or the single Max-age horizon) or the first nonpositive year-end net worth (investments, Cash CNY and property equity after mortgages). Nonpositive initial net worth stops before annual cash flows. Settle taxes/refunds at the stop; ledger/CSV end there, and later wealth percentiles include stopped paths as zero.
40. **Plain-English input help:** every configuration input, including conditional controls, list cells, run controls and the TOML editor, has an informational popup on hover or keyboard focus. Info buttons support taps; Escape dismisses help. Explanations describe actual units, interactions and inactive settings without changing calculations.
41. **Wheel-safe numeric entry:** focused numeric editors ignore mouse-wheel stepping while preserving value and keyboard focus. Decimal text, signed entry and normal keyboard edits remain supported.
42. **Fixed-by-asset income treatment:** remove holdings sections, named maps and reference fields. Stocks pay qualified dividends, bonds pay coupon interest with zero-gain sales, cash earns money-market interest, and Cash USD earns its rate or the T-bill return. Old holding declarations drop on import and the retired taxable type maps to brokerage.
43. **Dead layout fields removed (`retire-results-v2`):** drop the constant `alive_A/B`, always-zero `withdraw_cny`/`cny_cash_cny` and duplicate `spend_plan_cny` ledger columns (33 ledger fields, 5 chart fields, 38 CSV columns); collapse the income ledger's three identical dividend amounts into `dividends` and drop the write-only `nra_exempt_interest` and never-set `trad_inherited`. `properties[].proceeds_account` is retired: proceeds always land in brokerage, and older files carrying the key load with it dropped.
44. **Verification slimmed:** the M00–M11 milestone records, `verification/records/` evidence, `verification/archive/`, independent reference arithmetic (`recalculate.mjs`), inventory cross-checks (`check-artifacts.mjs`), the release and milestone report scripts, the numeric case CLI, the development harness page, the generated field matrix/inventory copies, `contracts.d.ts`, `result-layout.json`, traceability and household-gate documents are retired; they remain in git history at tag `verification-archive`. `src/config/fields.json` is the single hand-edited field inventory. `npm run check` runs the build (format/type checks), unit tests (including the still-applicable frozen oracle cases), `data:verify`, `verify:build` and the browser tests; test output goes to git-ignored `test-results/`. Where later sections cite the retired artifacts, this item states the current behavior.
45. **Spec synced to the code (2026-10-30).** Releases 0.1.0–0.6.0 changed behavior without log entries. The sections below now describe the current code, and these changes supersede the earlier items they contradict:
   - **Pension/annuity income** per person (annual USD from a start age, optional US-CPI COLA), taxed as ordinary US income (flat NRA rate for nonresidents) and never by China (§5.1, §6).
   - **Flexible spending returns** as optional guardrails on the non-medical budget, keyed to the prior year's portfolio return, with a `spend_flex` stream and the `spend_mult` ledger column (supersedes items 6 and 32; §5.2).
   - **What-would-it-take solvers** for extra non-retirement assets or the annual budget at 50/90/99/100% success (§7.2).
   - **History era presets and `market.outlook_shift`**, an explicit, default-zero constant added to stock and bond returns (§4.3.1).
   - **Server-managed market data:** the server refreshes and validates the package on a schedule and serves it at `GET api/market-data`; the app loads it at start. There is no homepage refresh button and no market-package upload/download (supersedes item 38; §8.6).
   - **Derived classifications:** omitted `us_income_tax_status` follows `us_citizen` (citizen → resident, non-citizen → nonresident); `sex` is retired from the UI and inert; `properties[].share_A` follows household size (amends items 13 and 31; §1.2, §5.1).
   - **Fixed accounts and simpler expenses:** three fixed accounts in withdraw order with derived ownership and brokerage basis equal to balance; no Cash USD/CNY accounts, withdrawal-order list or surplus selector; shocks have no lognormal size or scope; one-time costs are always additional; care starts at the earliest-born person's age; the `sell_when_liquid_below` strategy is retired (amends items 32, 35 and 42; §5).
   - **Strict legacy handling:** retired fields are rejected as unknown keys or invalid values; only `properties[].proceeds_account` is dropped (supersedes the discard/mapping wording in items 37 and 42; §9.2).
   - **Guided setup and languages:** Easy/Power guided setup and an English/Chinese UI; the default path count is 5,000 (§8.1).
46. **Non-citizens are NRA; code consistency fixes (2026-10-30).** By user decision, every non-US citizen, including a green-card holder, is taxed as a US nonresident alien for now. An explicit noncitizen/resident status still blocks Run because the resident-alien branch is not implemented (§1.2, §6.3). Manifests move to `retire-model-v6` and `retire-draws-v4`, covering the post-v5.1 features and the `spend_flex` stream, and drop `cny_cash_policy`. The Assumptions page loses its Cash CNY card, the ledger CSV comment no longer mentions CNY cash, and the year-detail NRA tax table splits retirement distributions from pension income.
47. **Dead list editor removed; funded-share aggregate renamed (2026-10-30).** No configuration field has ever used the `string[]`, `number[]` or `[number,number][]` types, so their validation rules and the primitive-list/tax-bracket editor, with its strings and styles, are removed. The aggregate `yearly_alive_not_depleted` becomes `yearly_success_probability`: the share of paths not yet depleted in each year, whose final value equals `success_probability`. No results change.


---

## 1. Purpose and success criteria

### 1.1 What it answers

For one household, the simulator answers: *"If we retire in mainland China starting in `start_year`, how likely is our money to last for both our lifetimes? How do our decisions, and the shocks we can't control, change that?"*

- **Decisions:**
  - spending level and optional flexible-spending guardrails;
  - asset allocation within the three fixed accounts;
  - pension or annuity income and its start age;
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
| Birth year | 1986 | 1986 |
| US citizenship | Yes | No |
| US income-tax status | Citizen/resident; Form 1040, MFS throughout | Nonresident, as for every non-citizen; Form 1040-NR |
| Household domicile | China for both; worldwide-income branch | (same household) |

Everyone remains alive through the younger person's Max age year (or the person's, when alone). The sample starts in 2027 with two people, so both are 41; Max age 110 gives 70 rows. The separate 2026 age-40 control with Max age 89 gives exactly 50 rows. A retired `sex` value, if present, has no effect.

Citizenship is a per-person checkbox, and US income-tax residency is derived from it when omitted: citizens use the resident branch and non-citizens the nonresident branch. **For now, every non-US citizen is taxed as a US nonresident alien (NRA), regardless of green card.** Under real-world rules a green-card holder is a US tax resident, but the resident-alien branch is not implemented, so an explicit noncitizen/resident combination blocks Run. One household China/US domicile covers one or two people. Actual missing values remain editable financial fields in the household draft; there is no Simulation checklist or verification checkbox controlling Run.

### 1.3 Success criteria for the software

1. **Reproducible runs.** Uploading a TOML file and building the same normalized configuration produce the same run. With the same seed, model/RNG/reference versions and browser engine, path results are identical regardless of worker count, chunk size or completion order (§3.2). Export a run manifest to identify those inputs.
2. **Speed and scale.**
   - `n_paths` is configurable from 1 to 100,000 (default 5,000) in the uploaded/built configuration and the app.
   - Browser-worker targets on the named laptop/browser are 2,000 paths under 10 s and 20,000 under 90 s; the browser performance test enforces both gates on every run (§11.3).
   - Progress, cancellation and input interaction remain responsive. Estimate memory before allocating a large run, including a pinned baseline (§3.2, §11.3).
3. **Realistic randomness.** Every random input is grounded in data (§4) and passes the realism checks in §11.2.
4. **Correct tax and cash accounting.** Tax results match §11.1; same-year bills, eligible credits and leftover memos reconcile. Complete §6.9 source checks before representing results as a household tax forecast.
5. **Complete app.** The app can:
   - edit every scenario field, including market parameters (the bundled tax tables are not editable);
   - run the scenario;
   - show the outputs in §7;
   - drill into one path's year-by-year ledger;
   - compare against a pinned baseline that uses identical random draws;
   - upload TOML, build a configuration from editable forms, and download TOML, a run manifest and a full-precision single-path CSV;
   - perform these operations without a user-configuration API or a server-side scenario directory.

---

## 2. Scope

The current scope is a static browser app with client-owned configurations, full-horizon market simulation, budget/medical expenses with optional flexible spending, pension/annuity income, financial accounts, rental properties, supported US/China income-tax branches and year-by-year funding with same-year tax payment.

Deferred work includes resident-alien/treaty-residency branches, §6013(g) elections, Roth conversions, AMT/short-term gains/wash sales, lot-level CNY gain accounting, detailed tax-status transitions, SSA earnings-history optimization and additional asset classes. Both-person mortality, survivor/estate events and recurring-spending lists are outside the current model by user instruction.

Observed US history and China/FX calibration references now pass independent source checks. Broad primary legal-source acceptance, household fact completion and broader empirical Monte Carlo targets remain separate OPEN requirements. A sample run does not establish a household FIRE funding recommendation.

---

## 3. Architecture

### 3.1 Data flow

**Framework:** React + TypeScript + Vite. TypeScript compiles to JavaScript; the delivered app is a static single-page application. React fits the large editable form and linked result views. Vite bundles the browser app and module workers. A read-only public-market-data gateway (dev/preview, the test host and the production server) serves the market-data package; it accepts no financial input or server configuration. The calculation engine has no React or DOM dependency.

```text
Local TOML upload ──► parseScenario ──┐
React configuration builder ─────────┴─► DraftScenario
                                         │ normalize + validate
Bundled or server reference data ─────────┼─► Scenario + effective tax tables
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
  - Components are `bootstrap`, `cn_cpi`, `fx`, `medical_occurrence` and `spend_flex`. Global components use an empty entity ID; `medical_occurrence` uses `A` or `B`. Property growth is deterministic and has no stream.
  - An open-interval uniform is `(nextUint32() + 0.5) / 2^32`. Normal pairs use Box–Muller with a fixed cosine-then-sine order. Pin its draw-consumption convention and numerical tolerances in the verification fixtures.
  - Generate every path's full market and latent household draws **before** its financial year loop. Consume one candidate-index uniform for the initial bootstrap row, then a jump and candidate-index uniform for every later year, including when no jump is selected. Enabled switches, taxes, spending and withdrawal decisions do not change stream consumption. Generate in bounded worker chunks rather than retaining all `N × T` latent arrays.
  - Streams are keyed by stable path IDs starting at zero, independent of path count, worker count, chunking and scheduling. Increasing path count preserves the original prefix. Adding or reordering properties does not change any stream.
  - Common random numbers mean the same latent draws under the same stream/version/timeline contract. Changing a market parameter intentionally changes the modeled path. Changing spending alone leaves market paths unchanged. A comparison must verify compatibility rather than relying on seed alone (§8.4).
- **Deterministic arithmetic order.** Assemble results by path ID and reduce/sort in that order. The same browser engine/build must reproduce raw numeric results exactly across worker counts. Cross-browser checks require identical integer RNG vectors, identical discrete decisions for the acceptance fixtures, and full-precision monetary results within USD/CNY0.01; transcendental functions need not be bit-identical across browser engines. Tiny numerical differences at decision boundaries must be investigated, not treated as arbitrary failed-path exclusions.
- **Nominal inside, real for reporting.**
  - Real CNY = nominal CNY ÷ China price index.
  - Real USD = nominal USD ÷ US price index.
  - Both indices are 1.0 at the start of the first simulated year.
- **Annual time step and fixed lifetimes.** `T = max_age − min(present start ages) + 1` for one or two people. Everyone is alive in every row, including the younger person's Max age year. The older person can exceed Max age. Ages 61/59 with Max age 110 give T=52; both 40 with Max age 89 give T=50; both 41 with Max age 110 give T=70. There are no drawn deaths or inactive post-death rows. Monthly inputs are multiplied by 12.
- **Financial stopping rule.** T is the upper bound. Stop after the first year with `cleanResidual(net_worth_cny) <= 0`, or before the first cash flow if starting net worth is nonpositive. Net worth values USD accounts and property equity after mortgages at that boundary's FX. Liquidity shortfalls alone do not stop a path with positive total net worth. Deduct leftover unpaid tax once at the stop; no subsequent financial year executes. Record reason/year/index/net worth in replay and CSV metadata; initialize unused ledger/chart slots to NaN. For cohort wealth charts only, terminated paths contribute zero after the stop. A fully funded last Max-age year that spends its final dollar remains a funding success.
- **No financial constant hides in the engine.** Every number in §4–§6 comes from the normalized scenario or effective tax tables. Schema defaults, browser starter constructors and the documented example agree. Algorithm/version identifiers are recorded separately.
- **Compact results.** Keep `CHART_FIELDS` in `Float32Array` and compact scalar summaries in typed arrays. At `N = 20,000`, `T = 52`, five chart fields take 20,800,000 bytes before summaries. Full ledgers and tax provenance are regenerated for the selected path from the immutable run request. Float32 chart data never determines depletion, capital netting or tax liability. Scalar monetary KPIs use Float64 summaries; chart bands are approximate visualization data.
- **Bounded memory.** A worker holds only its current path/chunk and immutable references. Transfer result `ArrayBuffer`s rather than cloning them. Before allocation, estimate chart arrays, summaries, worker workspace, aggregation buffers and any retained baseline. A resource rejection reports the estimate and keeps the requested path count unchanged. No mandatory `SharedArrayBuffer` or cross-origin-isolation headers.
- **Responsive execution.** A small module-worker pool performs simulation, aggregation and ledger replay. The main thread handles form state, short buffer copies and rendering. Job messages include `runId` and path ranges. Cancel terminates active job workers; late messages cannot replace another run. Any invalid generated factor fails the entire run, discards partial statistics and identifies its path/year (§4).
- **Immutable runs and provenance.** Normalize and snapshot the scenario, merged tables and reference data at Run. A manifest records schema/model/RNG/build versions, canonical scenario SHA-256, data/table hashes, seed, path count and horizon. Browser/worker/timing details are execution metadata. Editing a draft cannot mutate an active or pinned run.

### 3.3 Configuration and data ownership

- **Configuration is client-owned.** Read selected files with `File.text()`; construct new drafts in browser memory; validate and calculate locally; download with `Blob` and object URLs. A static host supplies app assets. There is no required scenario directory, configuration upload endpoint, database, server session or server-side user file.
- **TOML is the portable input format.** Use `smol-toml` for parsing/serialization and Zod for strict schema validation. The builder and uploaded files pass through the same normalization/validation functions. Add root `schema_version = 1`; preserve omitted required financial values and stable property IDs when exporting. Unknown fields produce errors rather than disappearing; the only exception is the retired `properties[].proceeds_account`, which is dropped.
- **Draft and runnable configurations differ.** Drafts can contain supported `unresolved` classifications and blank/incomplete fields. Complete drafts export as TOML even when run gates remain open. Structurally incomplete drafts remain editable; a draft export may omit blank required fields, and re-import restores those omissions as field errors. Run requires a complete, supported scenario. Legacy and versionless files are rejected; there is no migration path (§9.2).
- **Starters are browser constructors.** `createEmptyDraft` and `createExampleDraft` back guided setup and the sample; `createControlDraft` and `createHouseholdDraft` serve tests and are not offered in the app. The example TOML files are exports, not files the server reads. The household constructor retains unresolved facts (§9.3).
- **Public references are application assets.** Compile the checked historical JSON arrays, source/calibration manifest, source-verification registry and default tax-table object into the build. These are public model references, not saved user configurations. Data import/calibration is a development task; a normal simulation does not fetch Damodaran/FRED or read server files. A host running the gateway can supply a newer validated market-data package, which the app loads once at start (§8.6). The bundled tax tables are identical for every scenario.
- **Session state stays in memory.** Download is the persistence mechanism in v1. Reloading starts a new session; the user can re-upload a saved file. Display this beside Download. A completed current result and one pinned baseline may be retained within the memory budget. Browser database persistence/cloud sync are deferred.

### 3.4 Files

| File | Responsibility |
|---|---|
| `src/config/schema.ts`, `config.ts`, `constructors.ts`, `fields.json`, `downloads.ts` | Draft/runnable validation, TOML normalization, builder metadata, browser constructors and local exports |
| `src/model/rng.ts`, `canonical.ts`, `types.ts` | Versioned PRNG/path/entity draws, canonical hashing and typed state/protocol contracts |
| `src/model/market.ts` | Source rows, stationary bootstrap, CPI/FX/derived paths and domain checks |
| `src/model/consumption.ts`, `preview.ts` | Single-source budget spending, flexible-spending multiplier, aggregate medical base, shocks and continuing care |
| `src/model/accounts.ts` | Account state, returns, basis, rebalancing, withdrawals, RMDs |
| `src/model/property.ts` | Annual cash flow, depreciation, mortgage and sale (no withholding) |
| `src/model/tax.ts` | Resident/NRA calculations, netting, same-year credit, ending memo; unsupported worksheets fail explicitly |
| `src/model/engine.ts`, `layout.ts`, `ledger-report.ts`, `results.ts`, `comparison.ts`, `solver.ts` | Single-path year loop, Float64 ledger/provenance, compact results, Type7 quantiles, matched-path deltas and what-would-it-take bisection |
| `src/workers/simulate.worker.ts`, `analysis.worker.ts`, `pool.ts` | Chunk execution, aggregation/replay/comparison, run-ID guards, cancellation and transfer ownership; messages use model types |
| `src/App.tsx`, `main.tsx`, `src/components/`, `src/i18n/` | React builder, guided setup, file/run state, ECharts, results/comparison/solvers, paginated ledger and English/Chinese text |
| `src/reference/*.json`, `bundle.ts`, `calibration.ts`, `market-data.ts` | Bundled observed public references, population moments, hashes, market-data package validation and unverified legal-source registry; no user scenario fetch |
| `scripts/import-data.ts`, `bundle-data.ts`, `verify-data.ts`, `fetch-market-data.ts`, `build-info.ts`, `build-inputs.ts`, `verify-build.ts`, `export-examples.ts` | Development-only BIFF8 import/bundling, reference verification, public-source collection, reproducible build fingerprint, static-distribution checks and example export |
| `scripts/market-data-source.ts`, `market-data-refresh.ts`, `market-data-gateway.ts`, `serve.ts`, `static-files.ts`, `serve-test-build.ts`, `Dockerfile` | Shared public-source collector, scheduled server refresh, read-only `GET api/market-data`, production/test static servers and container image |
| `verification/fixtures/`, `market-tapes.ts`, `sources/`, `reference/*.py` | Frozen oracles and literal controls, literal return tapes, frozen public sources with independent receipts and stdlib source readers; no production config dependency |
| `src/verification/cases.ts` | Development-only adapters that run the frozen oracle cases against product modules for `tests/oracles.test.ts` |
| `package.json`, `package-lock.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tsconfig.json`, `index.html` | Reproducible JavaScript build, test configuration and static entry point |

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

The observed means, population SDs and correlation matrices are reproduced independently in the Python receipts `verification/sources/*/independent-acceptance.json` and rechecked by `npm run data:verify`. All SDs use `ddof = 0`, consistent with §4.3.1. Calculate exact moments from the selected window; do not substitute rounded references into rescaling. The earlier drawdown and Monte Carlo measurements below remain separate empirical targets; source reconciliation does not certify those measurements.

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

All configurations sample the exact selected-window source rows. The one explicit adjustment is `market.outlook_shift` (default 0, range −0.1…0.1), a constant added to every sampled stock and bond return; cash, inflation, volatility and sequences are unchanged. There are no Custom means/volatilities, affine rescaling, geometric-target adjustments or hidden constant-return configuration modes. Changing the sample window, directly or through a History era preset, changes the observed sample; changing income yields changes its taxable-income split, and adds no total return.

Use population moments/correlation for descriptive statistics. Validate finite source factors, nonnegative unlevered total-return factors and post-yield price factors, and strictly positive inflation/home-price index factors. Generated China CPI, medical indices, FX and combined property factors must remain valid and finite. Invalid requested jobs fail with series/path/year context; no clipping, resampling or selective path removal.

Fixed 3% arithmetic/PV controls use explicit literal annual rows in development-only `verification/market-tapes.ts`, passed to the same engine. The 50-year planning example (`examples/control-50year.toml`, no longer linked from the app) uses historical rows like every other configuration. The obsolete original projection oracle is RETIRED.

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
| Medical price index | `Π_{s<t}(1+π_cn[s]+medical_excess_inflation)`; a US domicile uses `π_us`. Excess 0.02 |
| Property value growth | `us_home[t]`, the sampled home-price change; no premium or idiosyncratic noise |
| Taxable income split | Income = `income_yield × start-of-year value` (sourced example: stocks 0.01335854176478289, bonds 0.051). For `usd_cash`, the whole return is income. Price change = total return − income |

All used gross factors and outputs must be finite. For every property, require `1 + us_home > 0` and a finite positive value. Medical factors require `1 + π + medical_excess_inflation > 0` for both China and US inflation. A holding's total loss of exactly 100% is supported only if its used price/income decomposition also remains valid; a zero holding balance must not cause log or return-weight division errors.

Market asset classes describe economic returns. Fixed asset treatment (§5.5) classifies stocks as qualified dividends and bonds/cash as ordinary interest; NRA treatment is dividends on equity and exempt interest otherwise.


**No CNY cash:** there is no CNY account; CNY needs are funded by converting USD at `S[t]·(1 − fx_spread)`. The former Cash CNY account, its real-rate/floor inputs and the deposit-rate series are removed. A CNY deposit could be revisited in a future model.

### 4.7 Market containers

- A `MarketPath` contains `Float64Array` fields `us_stocks, us_bonds, usd_cash, us_cpi, us_home, home_cpi` of length T, plus `fx, usd_index, home_index, usd_medical_index, home_medical_index` of length T+1.
- `generateMarketPath(scenario, reference, pathId)` regenerates the same path from its indexed streams. Workers keep path/chunk workspaces bounded; they do not require an in-memory object holding every path's full market arrays.
- Aggregate market bands and calibration summaries in workers. Selected-path replay includes the full market arrays for ledger verification. Chart buffers use explicit path/year/field indexing and a versioned field order.

---

## 5. Household model

### 5.0 Money convention: amounts are in starting-year purchasing power

| Input | Price treatment |
|---|---|
| Ordinary budget | Domicile price index (China index for China, US index for US) |
| CNY one-time items | China price index |
| USD one-time items, rent, maintenance, property insurance and HOA | US price index |
| Aggregate medical base, shocks and late-life care | Domicile medical price index; additional configured real growth as below |
| Property tax | Grows with the property's value, uncapped |
| Pension/annuity | US price index with `cola = true` (default); otherwise fixed nominal |

Balances, cost basis, property value, depreciation, mortgage balance and FX quota start at their entered nominal values. Mortgage payments stay fixed. Tax tables follow §6.8 indexing. A monthly care amount entered today is inflated from `start_year`, including years before care starts.

### 5.1 People and fixed lifetimes

People contain required `A`, optional `B` (absent for a one-person household), and household `domicile` (`US|China`). Each person has `birth_year`, `us_citizen` (unchecked means non-citizen), `us_income_tax_status` (derived from citizenship when omitted, §1.2) and `pension` (`annual` USD, `start_age`, `cola`). The retired `sex` (`F|M`) is accepted but inert. Age is `year − birth_year`.

A pension pays from the year the person reaches `start_age` through the horizon: `annual × usd_index[t]` with `cola = true` (default), otherwise `annual` nominal; `annual = 0` (default) means none. It arrives as spendable USD cash in the rent/RMD phase and is taxed as ordinary US income (§6.2–§6.3); China never taxes it (§6.4).

Everyone remains alive until the younger (or the single person) reaches `simulation.max_age`, inclusive. There is no Gompertz mode/dispersion, death age, mortality draw or death transition. The older person's age may exceed Max age. This policy is common to all configurations and recorded as `both-alive-to-younger-max-age` in the run manifest.

### 5.2 Budget spending

Budget is the single source of the initial annual included amount, denominated in household currency (USD for US domicile, CNY for China domicile) and inflated by the domicile price index (`usd_index` for US, `home_index` for China):

```text
ordinary_base = annual − included_health
ordinary[t] = ordinary_base × domicile_index[t] × spend_mult[t]
```

`spend_mult[t]` is 1 unless `budget.flex_enabled`. With flexible spending, a year after a positive nominal portfolio return uses `1 + u × flex_raise` and a year after a zero or negative return uses `1 − u × flex_cut`, with `u` from the `spend_flex` stream; the first year and years without invested capital use 1. `flex_cut` and `flex_raise` lie in [0, 1] (default 0.15). Medical costs, shocks, care and one-time costs never flex.

Require `0 ≤ included_health ≤ annual`. The medical base is counted once (§5.3), so 250,000 with 38,000 health means 212,000 ordinary plus 38,000 base medical at t=0.

There is no `spending[]` list, recurring item age window, survivor factor or `spending_rule`. One-time expenses (`name, year, amount, currency`) are separate, always additional and inflated by their currency's index.

Every budget uses initial treatment: `annual` states the first-year included budget; medical growth can change its future real cost. There is no budget mode and no ceiling-excess report.

Additional costs are funded and reported in actual total expenses but are excluded from included consumption. Late-life care, shocks and one-time expenses are always additional.

### 5.3 Medical costs and continuing late-life care

`budget.included_health` is one aggregate starting-year medical base for the couple, in household currency. There is no People medical-base field or second annual medical amount.

```text
base[t] = included_health × (1 + medical.age_growth)^t × domicile_medical_index[t]
home_medical_index[t+1] = home_medical_index[t] × (1 + home_cpi[t] + medical_excess_inflation)
usd_medical_index[t+1] = usd_medical_index[t] × (1 + us_cpi[t] + medical_excess_inflation)
```

At 4% home CPI, 2% medical excess inflation and 4% age growth, combined nominal growth is 10.24%; real growth against home CPI is 6%. Report this combined assumption rather than describing it as 4% medical growth.

Each person has an independently indexed occurrence draw. The shock probability at their age is `min(1, shock_prob_at_60 × 2^((age−60)/shock_prob_doubling_years))`. A realized shock is `shock_median × domicile_medical_index[t]`. Draws exist even when shocks are disabled; a disabled shock contributes zero. Shocks are always additional.

Late-life care lives under `[medical.late_life_care]`:

| Field | Meaning |
|---|---|
| `enabled` | Include the care expense; default false |
| `start_age` | Age of the earliest-born person at which care starts |
| `monthly` | Aggregate monthly care amount in starting-year household currency |
| `real_growth` | Annual growth in addition to the medical price index; default 0 |

```text
care[t] = monthly × 12 × domicile_medical_index[t] × (1 + real_growth)^t
```

Care is zero before the earliest-born person reaches `start_age`, then continues through the final simulation year. It is **always additional**: add it to Medical, total spending, funding needs and `additional_consumption_cny`; exclude it from `included_consumption_cny`. There is no end age or care budget-scope field. The configured amount is charged once, not multiplied by the number of people.

`medical_total = base + shock_A + shock_B + care`. Selected-year provenance shows base, shocks and care separately. Disabled care greys out its subordinate controls; the shipped sample enables an illustrative RMB8,000/month from age 85 (both people are born in 1986).

### 5.4 Social Security exclusion

Social Security is excluded from the entire simulation: no benefits are ever paid, no configuration carries Social Security inputs, and legacy Social Security fields are rejected as unknown keys on import. There is no Social Security ledger column or taxation code.

There are no survivor eligibility/amount/claim controls or benefit transitions; everyone remains alive. Pension/annuity income (§5.1) is the only modeled benefit income.

### 5.5 Accounts and fixed income treatment

Account fields are `name`, `type`, `balance`, `allocation` and, for `pre_tax` only, `rule_of_55` and `allow_early_trad`. Every configuration holds exactly three accounts in this fixed order, which is also the withdrawal order: `brokerage` (Non-retirement liquid assets), `after_tax` (After-tax retirement savings) and `pre_tax` (Pre-tax retirement savings). Names and types are fixed and hidden in the builder.

There are no per-asset income settings. Brokerage income is fixed by asset: `us_stocks` earnings at the configured dividend yield are qualified dividends, `us_bonds` earnings at the configured bond yield are coupon interest, and `usd_cash` earns its full market return (the T-bill rate) as money-market interest. Bond sales realize zero gain (held to maturity). All income is US source. Retirement wrappers record no annual income; their rules apply to withdrawals.

Ownership is derived: each account is split evenly with two people and owned fully by A with one. Shares stay fixed and drive income attribution, access, RMDs and penalties per owner. The brokerage account starts with tax basis equal to its balance, allocated by asset weights; reinvested taxable income increases basis, and year-end rebalancing can realize taxable gains. There are no inheritance transfers or basis step-ups.

Retired holding maps/links, cash account types (`cash_usd`, `cash_cny`), per-account `owner`/`share_A`/`cost_basis`/`interest_rate` and the old `taxable` type are rejected on import. New exports contain no holding declarations.

| Type | Currency / treatment |
|---|---|
| `brokerage` | USD; fixed-by-asset income, average-cost gains on stock/cash sales/rebalancing; bond sales zero-gain; receives surplus cash and property-sale proceeds |
| `after_tax` | USD (Roth-like); withdrawals are untaxed by the US and China; access from 60 |
| `pre_tax` | USD; distributions are ordinary US income and untaxed by China; owner-specific access/penalty/RMD rules |

### 5.6 Access ages and RMDs

- **When `pre_tax`/`after_tax` can be withdrawn** (the whole account opens once any owner qualifies):
  - from the year an owner turns 60 (a conservative stand-in for 59½);
  - from 55 if `rule_of_55` is set (`pre_tax` only);
  - at any age if the `pre_tax` account's `allow_early_trad` is set. The 10% penalty applies to each underage owner's share of `pre_tax` withdrawals before 60 (55 with `rule_of_55`). Early `after_tax` withdrawals are never allowed.
- **RMDs.**
  - They come from `pre_tax`, starting in the year each owner reaches 73 (born before 1960) or 75 (born 1960 or later), on that owner's share.
  - Each year's amount = the owner's share of the prior year-end balance ÷ the Uniform Lifetime divisor for that age (§6.8).
  - RMD cash covers needs first. Any excess is deposited into `brokerage`.

### 5.7 Withdrawals and FX conversion

- **Need.** Each year, need = expenses − income, tracked separately in CNY and USD.
  - USD income (net rent, RMDs and pensions) first covers USD expenses.
  - Any USD left over is converted to cover CNY needs at `S[t]·(1 − fx_spread)`.
- **Surplus.** Whatever remains after that is deposited into `brokerage`.
- **Shortfall:** withdraw in the fixed order `brokerage`, `after_tax`, `pre_tax`:
  - USD accounts pay USD needs directly. A CNY need costs `cny / (S[t]·(1 − fx_spread))` USD. Default `fx_spread` = 0.003.
  - Accounts that can't be accessed yet are skipped. A brokerage account sells across asset classes in proportion to balances, realizing gains except on bonds.
- **Still short:** if `last_resort_property_sale` is set, attempt remaining properties in order, using proceeds after closing costs and mortgage payoff (§5.8). An infeasible sale does not create proceeds.
- **Still short:** record `shortfall_cny`. The path is **depleted** from its first shortfall year.
- **FX quota flag.** A year is flagged when USD converted to CNY exceeds `fx_quota_usd_per_person` (default 50,000) times the number of people. Above the quota, China's FX authority (SAFE) asks for documentation when converting.

### 5.8 Properties (US)

**Fields:** all properties are US properties.
- identity and ownership: `id` (stable unique ID), optional editor-only `label`, and `share_A`, derived from household size when omitted (1 alone, 0.5 joint) and hidden in the builder;
- value and basis: `value, cost_basis, land_share (0.2), depreciation_taken`;
- mortgage: `mortgage_balance, mortgage_rate, mortgage_years_left`;
- rent and running costs: `rent_monthly, maintenance_annual, property_tax_annual, insurance_annual, hoa_monthly`;
- growth and noise: `rent_real_growth (0)`; appreciation is deterministic with no premium or idiosyncratic noise;
- sale costs: `selling_cost (0.06)`. No state tax is modeled;
- strategy: `strategy, sell_year`.

**Each year while held:**
- Gross rent = `12·rent_monthly·US index[t]·(1+rent_real_growth)^t`.
- Expenses = `maintenance_annual·US index + property tax + insurance_annual·US index + 12·hoa_monthly·US index`.
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
| `sell_year` | `year ≥ sell_year`, so the first year at or after it while held |

The retired `sell_when_liquid_below` strategy and its `sell_liquid_years` field are rejected on import.

**Sale:**
- Costs = `selling_cost × value`.
- Each owner share's adjusted basis = basis − depreciation taken. Gain = share × (value − costs) − adjusted basis.
- All property gains use LTCG rates before capital netting; the §1250 25% bucket is intentionally not modeled. A net sale loss enters ordinary property income. There is no Section 1231 history or lookback. Property losses are not automatically securities-style capital losses (§6.2).
- Closing proceeds = value − costs − mortgage balance. There is no FIRPTA withholding: every sale assumes citizen ownership, so the full proceeds are available at closing.
- Cash available at closing = proceeds. Deposit that amount in Non-retirement liquid assets (`brokerage`).
- If closing cash is negative, quote the required closing contribution. Execute only if accessible funds can cover it using the normal withdrawal rules; record resulting gains/distributions. Otherwise record `sale_failed`, keep the property and mortgage, realize no gain, and continue the shortfall walk. No automatic bridge loan is assumed.
- Each owner's gain for China is computed in CNY: `(share·(value − costs) − adjusted basis)·S[t]`, converting the USD gain at the sale-year FX rate. Initial ownership/basis remains unchanged except for normal depreciation and sale.
- Suspended passive losses on the property are released.

**Acceptance example:** a $1M sale with a $700k mortgage and $60k costs leaves $240k at closing. For the user's no-sale scenario, set `hold` **and** `last_resort_property_sale = false`.

### 5.9 Planning-horizon memo

Ownership and alive status remain fixed. There are no final-death deductions, attribute expiry on death, survivor transfers, inherited accounts, basis step-ups or estate taxes.

At the end of the younger person's (or the single person's) Max age year, deduct leftover unpaid income tax once at ending FX (§6.7). Ending balances and this memorandum are recorded before returning the path summary. No extra spending year is added and an unpaid tax bill is never relabeled as cash paid.

### 5.10 Year loop (required order)

For each `t = 0 ... T−1`, using `year = start_year + t`:

1. Capture opening liquid USD/net worth CNY before this year's flows.
2. Carry any leftover unpaid tax from the prior year into this year's payment pool.
3. Check property strategies and feasible closing contributions; record sale gains (no withholding).
4. Collect rental cash, RMDs and pensions.
5. Calculate the ordinary budget (times the flexible-spending multiplier), aggregate medical base, shocks, continuing care, one-time expenses and included/additional totals.
6. Fund consumption from accessible accounts and permitted last-resort sales; deposit surplus or record shortfall.
7. Apply financial and property returns; record taxable income and weighted financial return.
8. Rebalance and record taxable gains.
9. Compute current US/China income-tax bills and pay them the same year, paying US bills before computing the China credit and iterating so tax-driven withdrawals are taxed too.
10. Value ending balances and write the ledger; on the last row, finalize the ending income-tax memorandum and summary.

Beginning-year withdrawals do not earn that year's return. This is the ten-phase sequence in `src/model/engine.ts` (`YEAR_PHASES`); flexible spending acts inside step 5, and there is no death/estate phase.

### 5.11 Success, depletion and forced sale

A path is depleted from its first real funding shortfall; a residual at most 1e-6 is numerical zero (§6.5). Success is never depleted over the configured horizon. A forced sale is a permitted last-resort property sale.

A depleted path keeps running while its net worth stays positive (for example on property equity), reporting planned costs, funded amounts, remaining shortfalls and unpaid taxes; it stops at the first nonpositive year-end net worth (§3.2). Leftover unpaid tax is a separate ending metric. Late-life care is funded as an additional expense in every applicable year.

---

## 6. Tax model

### 6.1 Income ledger

Each year the engine collects USD amounts for each person:

`interest_us, dividends, cap_gain (net realized, may be negative), trad_own, pension, roth, early_trad, rental_net, rent_gross, ordinary_property_gain, ltcg_property, property_gain_cny, passive_released`

- Account income is split by ownership share. Property items are split by owner share.
- China's calculation converts at `S[t]`, except `property_gain_cny`, which is already in CNY.
- Property sale records retain owner, income year, proceeds, depreciation and gain character. There is no Section 1231 loss history; sale classification uses the §6.1 split directly before Schedule D netting.
- `CapitalNet` contains nonnegative `lt_gain`, `ordinary_loss_deduction` and `loss_carryforward`. Store capital-loss carryforwards as positive amounts, with long-term character in v1. Preserve the raw inputs; net outputs are not added to raw gains a second time.
- Per-member bills record final federal income tax; China bills are net of the same-year US credit. Leftover unpaid tax carries one scalar per currency and is memo-deducted at the terminal boundary.
- Fixed asset-class tax treatment is independent of the sampled market-return class (§5.5).
- `dividends` is stock income: qualified dividends for residents, flat-rate FDAP dividends for NRAs and taxable dividends in China. `interest_us` is bond and cash income: ordinary interest for residents, exempt portfolio interest for NRAs and taxable interest in China. Each amount is counted once.

### 6.2 US: supported resident branch (Form 1040)

Select by `us_income_tax_status = "resident"`, which citizens get by default (§1.2). A noncitizen resident configuration requires an implemented branch and credit/treaty rules before it can run.

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
4. **AGI** = ordinary income after the allowed capital-loss deduction + qualified dividends + `CapitalNet.lt_gain`. Ordinary income includes interest, `trad_own`, pensions, allowed rental income and ordinary property amounts. Each net capital bucket is included once.
5. **Deduction** = standard deduction only. The 65+ add-on and senior deduction are removed.
6. **Taxable income:** TI = `max(0, AGI − deduction)`. Regular tax uses the statutory formula below.
7. **NIIT** = `0.038 · min(NII, max(0, MAGI − threshold))`.
    - Derive NII from eligible net investment income after the same capital/property netting and applicable deductions; floor the final NII at zero. Retirement distributions are not NII. Do not reuse a gross gain eliminated by a capital loss.
   - The threshold is 125,000 (MFS) or 200,000 (Single), and is not indexed.
8. **Early-withdrawal penalty** = `0.10 · early_trad`.
9. **US-side foreign tax credit is not implemented.** The separate China-side credit equals same-year eligible US-paid tax, capped at the China bill. The sample household is China domiciled; the sample does not assume China taxes A at zero. These supported branches still require the broader cross-border source audit.

**Capital-gains rate formula** (IRC §1(h)(1)). QD = qualified dividends; LT = `CapitalNet.lt_gain` after netting. There is no §1250 bucket.

```
ANCG = min(TI, QD + LT);   base = TI − ANCG
gains = ltcg_rates[0] on ANCG up to ltcg_0_top, ltcg_rates[1] up to ltcg_15_top, ltcg_rates[2] above — ANCG stacked from base to TI
tax   = min(regular(TI), regular(base) + gains)
```

**Required example:** MFS, ordinary income $100k, long-term securities loss $20k and property gain $50k with $10k prior loss: net gain $20k, deduction $16,100, TI $103,900, income tax $16,170, loss carryforward $0.

### 6.3 US: supported nonresident branch (Form 1040-NR)

Every non-citizen, including a green-card holder, uses this branch (§1.2); an omitted status resolves to `us_income_tax_status = "nonresident"`. The treaty rates are example assumptions.

- **Income not connected with a US business (FDAP):** taxed at flat rates with no deductions.
   - equity dividends: 10% under the example treaty assumption;
   - exempt interest: 0;
  - securities gains: 0;
  - `trad_own` and pensions: the `own_pension` rate, 0 (treaty Art. 17(1));
  - `roth`: 0;
  - No inherited account or distribution is generated in this fixed-lifetime model.
- **US business income (ECI, under the net-basis election):**
   - It covers `rental_net` under the supported passive rules, plus property income/gains after the §6.1 split.
  - TI has **no deduction**.
   - Tax uses the household's filing schedule (MFS with two people, Single alone) and the §6.2 netting/rate procedure for ECI-eligible capital items. Do not import an untaxed non-ECI securities loss into this netting pool without a supported rule.
- **Additional treatment:**
  - No NIIT.
  - The 10% early penalty applies to `early_trad` here too. That's conservative, since whether the treaty covers the penalty is unverified.

**No FIRPTA withholding is modeled.** Sale-date proceeds carry no prepayment (§5.8). The seller's final federal liability is computed and paid the same year; there is no withholding to credit against it.

### 6.4 China IIT

China IIT applies to every household member every year when the household `domicile` is `"China"`, and never when it is `"US"` (the six-year reset is always taken).

| Item | China tax |
|---|---|
| Dividends, US interest | 20% |
| Net realized securities gains | 20%, on gains ≥ 0, netted per year with no carryforward, using USD gain × `S[t]` |
| Rent | 20% × 80% of gross rent |
| Property gain (USD gain × sale-year FX) | 20%, if positive |
| `pre_tax` and `after_tax` distributions, pensions | Exempt: retirement and pension income is not taxed in China |

**Same-year credit against eligible US-paid tax.**

China due = `max(0, china_tax_before_credit − min(china_tax_before_credit, eligible_us_paid_usd × S[t]))`. Eligible US tax excludes tax attributable to China-exempt pension income; penalties never qualify. No vintages, carryforward, withholding allocation or refund adjustments exist.

**Required example:** China raw $15,360 with $8,066 eligible US-paid tax gives $7,294 due the same year.

- China uses a flat 20% rate with a rent deduction; there are no brackets and nothing is indexed.

**Six-year rule.** It needs one trip abroad longer than 30 days in at least one year out of every six. Model the trip's cost as a spending or one-time item if you like.

**What this means in practice.** One US dollar of dividends costs B 10% US tax + (20% − 10% credit) China tax = 20%. For A it costs 0% or 15% US tax plus China tax of 20% less that credit, again about 20% in total, because China tax applies to every member of a China-domiciled household.

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
  - Standard deduction: single 16,100; MFS 16,100. The 65+ add-on and senior deduction are removed.
- **Capital gains:**
  - Preferential rate array: `ltcg_rates = [0.0, 0.15, 0.20]`; exactly three rates in [0, 1].
  - Long-term thresholds: `ltcg_0_top` single and MFS 49,450; `ltcg_15_top` single 545,500, MFS 306,850.
  - The unrecaptured §1250 25% rate and its `top_lt25` ceiling are removed.
  - Capital-loss limit: single 3,000; MFS 1,500.
- **NIIT:** rate 0.038; threshold single 200,000, MFS 125,000.
- **Passive allowance** 25,000, phasing out between 100,000 and 150,000; MFS living with spouse 0.
- **Other:** early-withdrawal penalty 0.10; depreciation period 27.5 years; RMD start age 73 (born before 1960) or 75 (born 1960 or later).
- **Uniform Lifetime divisors:** 72 27.4, 73 26.5, 74 25.5, 75 24.6, 76 23.7, 77 22.9, 78 22.0, 79 21.1, 80 20.2, 81 19.4, 82 18.5, 83 17.7, 84 16.8, 85 16.0, 86 15.2, 87 14.4, 88 13.7, 89 12.9, 90 12.2, 91 11.5, 92 10.8, 93 10.1, 94 9.5, 95 8.9, 96 8.4, 97 7.8, 98 7.3, 99 6.8, 100 6.4, 101 6.0, 102 5.6, 103 5.2, 104 4.9, 105 4.6, 106 4.3, 107 4.1, 108 3.9, 109 3.7, 110 3.5, 111 3.4, 112 3.3, 113 3.1, 114 3.0, 115 2.9, 116 2.8, 117 2.7, 118 2.5, 119 2.3, 120+ 2.0.
- **NRA rates:** dividends 0.10, capital gains 0, own pension 0 (also applied to pensions and annuities); portfolio interest is exempt by rule. There is no inherited-IRA scenario setting.
No estate table is bundled; estate figures survive only in the frozen oracle file.

**China:**
- flat rate 0.20; rent deduction 0.20. The basic deduction, comprehensive brackets and FTC carryforward are not used and are not in the bundled tables.

**Indexing.**
- **Indexed by the path's US price index**, as a stand-in for chained CPI: US brackets, the standard deduction and long-term gain thresholds.
- **Not indexed** (this is real bracket creep): the NIIT thresholds, the passive allowance and its phase-out, the capital-loss limit and all China amounts.

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
ltcg_rates = [0.0, 0.15, 0.20]
ltcg_0_top = { single = 49450, mfs = 49450 }
ltcg_15_top = { single = 545500, mfs = 306850 }
cap_loss_limit = { single = 3000, mfs = 1500 }
niit_rate = 0.038
niit_threshold = { single = 200000, mfs = 125000 }
passive_allowance = 25000
passive_phaseout = [100000, 150000]
early_penalty = 0.10
depreciation_years = 27.5
rmd_start_age = { before_1960 = 73, from_1960 = 75 }
uniform_lifetime = { 72 = 27.4, 73 = 26.5, 74 = 25.5 }   # …every age 72–120, values as listed above

[us.nra]
dividends = 0.10
cap_gains = 0.0
own_pension = 0.0

[cn]
flat_rate = 0.20
rent_deduction = 0.20
```

### 6.9 Primary-source status and checked worksheet subset

The current public source registry is `src/reference/source-gates.json` (15 rows). Whole-rule legal acceptance remains unverified; it is reported separately and never controlled by a config checkbox. The original 18-row M00 registry (`verification/source-gates.json`) is in git history at tag `verification-archive`, without invented edition/date evidence.

The former scoped §1250 capital check went with the removed worksheet ordering; it is in git history at tag `verification-archive` (`verification/archive/pre-tax-simplification/`).

- Supported all-long-term securities gains/losses and prior long-term capital-loss carryovers; current example-config sale/loss regression runs successfully.
- Short-term/collectibles and the broader cross-border tax audit remain OPEN. Section 1231 history and lookback are removed. The frozen broad `CAPITAL-PARTIAL` conditional oracle is still OPEN.

Other applicable source work includes US tables/passive/RMD rules, NRA treaty rules, and household China domicile/deposit/FTC rules. Historical estate/death/survivor rules have no current financial role.

All configurations share calculation/validation. Missing required values or unsupported combinations block Run; source status remains visible independently. A numeric PASS verifies arithmetic under its stated scope and does not upgrade all legal sources.

---

## 7. Outputs

### 7.1 Ledger and annual report

One full-precision row exists for each of the T years. The v2 core field order is:

`year, age_A, age_B, fx, home_index, usd_index, spend_cny, medical_cny, medical_base_cny, medical_shock_cny, one_time_cny, included_consumption_cny, additional_consumption_cny, rent_cash_usd, rmd_usd, portfolio_return, withdraw_usd, convert_usd, tax_us_A, tax_us_B, tax_cn_A, tax_cn_B, liquid_usd, property_equity_usd, net_worth_cny, net_worth_cny_real, liquid_cny_real, net_worth_usd_real, shortfall_cny, forced_sale, sale_failed, fx_quota_flag, spend_mult`

- An absent Person B reports `age_B = -1`. The former alive-flag, planned-spend, CNY-cash, estate/death/SS/state-tax/payment-credit slots are removed, not zero-filled.
- `spend_cny` is ordinary budget spending after `spend_mult`, the flexible-spending multiplier (1 when off); `one_time_cny` is separate. Medical is the single Budget base plus each member's shocks and always-additional continuing care. Provenance contains `medical_detail.base_cny`, `shock_cny` and `late_life_care_cny`.
- Tax columns record this year's computed bills, paid the same year; China bills are net of the same-year US credit. Leftover unpaid tax is a terminal memo deduction from heirs, not a settlement.

Five reporting values accompany replay/CSV (`retire-ledger-report-v1`, 38 CSV columns):

| Field | Meaning |
|---|---|
| `starting_liquid_usd` | Opening liquid USD before current-year flows |
| `starting_net_worth_cny` | Opening nominal net worth at opening FX |
| `spend_excluding_medical_cny` | Ordinary budget plus one-time costs |
| `medical_total_cny` | Aggregate base, shocks and care |
| `annual_investment_return` | Balance-weighted return across the USD financial accounts, measured after opening-year flows at opening FX; before tax/FX changes; property excluded |

A financial return with no invested capital is missing, not 0%.

The UI rounds **all money values to integers**. FX, indices and ratios retain decimals; returns use percent formatting. Engine decisions, summary scalars, replay/provenance and CSV keep Float64 precision. The UI is not a rounded calculation path.

### 7.2 Summary metrics

Success is the share of all requested paths with no funding shortfall through T. Forced-sale probability, depletion-age quantiles/histogram, wealth/liquid bands, FX/CPI bands, lifetime income taxes paid and ending leftover-tax/after-tax assets are separate outputs.

Everyone remains alive. Stopped paths contribute zero to subsequent wealth percentiles, so all N paths contribute to every year's cohort; the funded-through-year curve uses N throughout. There is no mortality survival estimate or estate-tax card. Summary names such as `terminal_net_heirs_*` mean ending after-income-tax assets (§6.7).

**What would it take.** For success targets of 50/90/99/100%, the solvers find the smallest extra USD added to `brokerage`, capped at the larger of $10M and 25× investable assets, or the largest annual budget with medical unchanged, floored at zero. They rerun complete runs with the same seed, paths and references, bracket then bisect, show progress with cancel, and report a target as out of reach at the cap or floor (`src/model/solver.ts`, `src/components/Solver.tsx`).

Quantiles remove missing observations, sort ascending and interpolate at `h=(n−1)q` (Type 7). `[1,2,3,4]` gives p10=1.3, median=2.5 and p90=3.7. Empty cohorts produce no value. Monetary scalar KPIs use Float64; chart bands use compact Float32 visualization data. Representative paths are actual stably ranked paths, using `floor(q×(N−1))` for worst/p10/median.

CSV uses round-trip-safe numeric strings, identifies the immutable run/path/manifest/stop, retains all 38 columns and includes only simulated annual rows. Display rounding does not change exported values.

---

## 8. Browser web app

### 8.1 Local configuration entry and builder

The start page offers the sample config, TOML upload and guided setup. Guided setup starts from a blank draft (US domicile, current-year start, Max age 110, random seed, one person): Easy mode asks six questions, Power mode walks nine steps with the builder editors embedded, and finishing runs the simulation. All inputs use the same strict normalization/validation; user files are never sent to a configuration service or automatically persisted. Download saves a draft; reload requires re-upload. The UI switches between English and Chinese live.

The builder covers the 86 serialized fields in `fields.json` except the derived or retired `share_A`, `us_income_tax_status` and `sex`, which remain editable through TOML. Simulation has only start year, path count, seed and Max age; Random seed buttons share the draft seed and draw a valid uint32.

Markets, inflation & FX contains three sections:

- **Markets:** History era preset or custom window, bootstrap block length, outlook shift and stock/bond income yields over unchanged joint historical US rows.
- **Inflation:** China CPI and medical excess inflation; US CPI comes from historical rows.
- **FX:** spot/fair value, mode/drift/PPP/noise/trend/spread/quota.

People contain Person A (required) and Person B (optional, added with a `+` button), each with birth year, a US citizen checkbox and pension fields, plus one household US/China domicile. Social Security inputs are removed. Budget contains the annual budget, Medical expenses, flexible spending and the Medical group of shocks and care; care has no end age/scope and is always additional. There is no recurring-spending list or People medical-base field.

Numeric inputs preserve decimal text during typing, including `0.003` and signed values; finite-number/integer/range validation still controls Run. External config changes synchronize the editors.

Mouse-wheel gestures cannot step a focused numeric field or change its value; keyboard focus and edits remain intact. Each input has a plain-English explanation shared with the inventory, accessible through hover, focus or its info button. Popups remain inside the viewport, can be hovered and dismissed with Escape or an outside click, and do not mutate the draft. Editing a value closes help. Run Paths/Seed and the TOML editor also have help.

Accounts show the balance and allocation of each fixed account plus the pre-tax access flags (`rule_of_55`, `allow_early_trad`). There are no holding settings, basis or interest-rate fields.

### 8.2 Runs and state

Prepare an immutable request and manifest, enforce client-memory preflight, run bounded workers, aggregate off the main thread, and show progress/cancel/errors. Draft edits, market refreshes and failed/canceled jobs never replace completed/pinned results. Replay uses the original completed run's references, not the current public bundle. An invalid generated factor fails the whole requested job.

### 8.3 Results and ledger

Show wealth/liquid/FX bands, funded-through-year curve, depletion histogram, income-tax/ending-asset/budget metrics and the what-would-it-take solvers. Replay one stable path and paginate its ledger; all money is integer display with full-precision downloadable provenance/CSV. Show the five annual report fields and the medical base/shock/care split.

### 8.4 Comparison and downloads

Pin one immutable baseline within the memory budget. Compatible versions/build/seed/timeline/property IDs/reference hashes allow paired current-minus-baseline Float64 path differences and Type 7 quantiles; incompatible runs are labeled unpaired. Download draft/run/baseline TOML, scientific/execution manifests, comparison JSON, ledger CSV and path provenance JSON locally. Manifests record the lifetime and nonpositive-net-worth stopping policies.

### 8.5 Verification surface

There is no in-app verification surface; the former `/verification` harness was retired on 2026-10-30. `npm run check` runs the build, unit and oracle tests, `data:verify`, `verify:build` and the browser tests; browser evidence goes to the git-ignored `test-results/`. No manual sign-off is required.

### 8.6 Public market refresh and portable references

Market data is server-managed. The production server (`npm run serve`, Docker) refreshes NYU annual returns/dividend data plus FRED `CPIAUCNS`, `FPCPITOTLZGCHN`, `DEXCHUS` and `DGS10` every `MARKET_DATA_REFRESH_HOURS` (720 by default). It runs the independent Python check and a no-regression guard, then atomically swaps the package served at `GET api/market-data`; failures keep the previous package and are recorded in `status.json`. The endpoint accepts no request parameters, body, credentials, scenario files or user financial inputs. The app requests it once at start and applies a valid package; there is no refresh button or market-package upload/download. NYU/FRED lack browser CORS headers, so the browser never fetches them directly. Dev/preview hosts fetch the sources live through the same gateway, the test host serves the bundled package, and static hosts without the gateway keep the bundled package.

The shared collector backs `npm run data:fetch -- --output <directory>`. It checks exact NYU sheet/column headers, consecutive complete calendar years, FRED missing values, finite domains, income-rate definitions and source/package hashes. Fetch all five before applying any. Detect the latest complete US year dynamically; China/FX histories provide calibration references. On source, parser, package or network failure/cancellation, preserve current references and the latest edited draft. Nothing is persisted in the browser.

Apply the two income yields and latest spot FX to the current draft, retaining budgets, allocations, fair value and configured China/FX/medical risk parameters. Extend a sample end only if it matched the previous latest complete year; retain a deliberately narrower window. Show fetched/source observation dates, definitions, values and hashes.

The old 0.013/0.042 income assumptions had no dated source. The shipped replacement is NYU 2025 dividend yield `78.57 / 5881.63 = 0.01335854176478289` and FRED DGS10 2026-10-15 `5.10 / 100 = 0.051`. DGS10 is a 10-year Treasury **par-yield income proxy**, which may differ from an existing portfolio's coupon income. Both values split total returns rather than adding return. Their static example defaults retain their observation dates; a newer server package supplies new values.

`retire-market-data-v1` packages contain annual US/China/FX rows, latest observations, income yields and raw source hashes. Their scientific content hash excludes retrieval timestamps; identical raw observations reproduce the same hash. Completed runs capture the whole package and include its hash in the manifest. The run manifest embeds the package, but the app cannot load it back, so a saved TOML reruns identically only while the same package is active. A refreshed dataset never changes an earlier/pinned ledger. Updated source hashes make comparisons unpaired. Frozen shipped raw values and yields are independently reconciled using stdlib BIFF/CSV readers; runtime refresh validates shapes/hashes but does not claim an independent audit of future provider revisions.

---

## 9. Portable TOML configuration schema (illustrative example)

### 9.1 Complete exported example

[examples/sample.toml](../examples/sample.toml) is the sample configuration. It normalizes to the same scenario as the in-browser `createExampleDraft`, and `npm run examples:export` rewrites it from that constructor with every default spelled out. It starts in 2027 with both people born in 1986 and has a maximum 70-year horizon, ending earlier if net assets become nonpositive. It holds the three fixed accounts, one held rental property and a China domicile, and explicitly enables a late-life care illustration; Social Security is not modeled. [`src/config/fields.json`](../src/config/fields.json) lists every key with its unit, default and omission rule.

### 9.2 Common validation and supported combinations

Local imports and the builder share `parseScenario`, `normalizeScenario` and `validateScenario`. A failed import preserves the current draft. Run snapshots a complete supported configuration; drafts with missing facts remain editable and downloadable when structurally valid.

- Root `schema_version=1`, uploads at most 2 MiB, strict known keys, finite numbers and safe integer fields. Versionless files are rejected. Unique nonempty property IDs are required, and accounts must be exactly the three fixed accounts in order.
- Retired fields (Simulation metadata, mortality/survivor/estate fields, recurring-spending rules, People medical bases, care end/scope, CNY deposit rate/floor, holdings, per-person domicile, Section 1231 history, Social Security inputs, property name/vacancy/fee/cap/premium/noise/FIRPTA fields, the liquid-threshold sale strategy, tax and tax_tables sections, retired account type names) are rejected on import; only `properties[].proceeds_account` is dropped so older files keep loading. There is no migration path; imports never mutate the supplied object or invent legal status.
- Every configuration uses the same required-input, reference, range and supported-tax-combination checks. Source status is reported independently; no `kind`, assumptions list, unresolved-input checklist or legal-verification checkbox affects calculations or Run.
- Citizen/resident and noncitizen/nonresident income branches are supported, and an omitted status follows citizenship. A citizen cannot use NRA; every non-citizen, including a green-card holder, is an NRA, so an explicit noncitizen/resident combination is unsupported. Domicile is one household-level US/China selection. There are no estate inputs.
- Each start age is an integer in 18…100. Max age is an integer in 18…200 and at least the younger start age (or the single start age). The older person may exceed Max age; the inclusive fixed horizon must remain positive.
- Nonzero initial capital/passive/FTC/bill histories need a schema extension; examples assume zero initial histories.
- Each of the three fixed accounts needs a nonnegative balance and an allocation that is nonnegative and sums to 1 within 1e-6. `rule_of_55` and `allow_early_trad` are allowed only on `pre_tax`. Retired holdings and account type names are rejected on import.
- Withdrawal order is fixed, and surplus cash and sale proceeds go to `brokerage`. Property hold and no last-resort sale together enforce no-sale behavior. Basis/loan/cost inputs remain required for possible sale treatment. A one-person household holds every property fully (`share_A = 1`), and a positive mortgage needs remaining years.
- Budget requires nonnegative annual/health amounts with health no larger than annual; both are single-source amounts. Flexible-spending cut/raise limits lie in [0, 1]. Care has enabled/start-age/monthly/real-growth controls and is always additional. Pensions need a nonnegative annual amount and a start age in 0…120. Growth/factor and money ranges are enforced.
- Social Security is not modeled: there are no inputs and no benefits are ever paid.
- Market window is within the active source history and at least ten years; bootstrap mean is at least one; outlook shift lies in −0.1…0.1. Spot/fair value are positive; valid mode/drift/spread/noise ranges and generated factors are required. An inadmissible window or generated factor fails explicitly instead of clipping/resampling/dropping paths.
- There are no tax overrides: every configuration uses the same bundled reference tables.
- Integer path count is 1…100,000 and seed 0…4,294,967,295. Client-memory preflight includes pinned results and can reject a requested size without changing N.

All 86 current paths and omission/default rules are in [`src/config/fields.json`](../src/config/fields.json). Numeric text precision is retained while editing; invalid incomplete/nonfinite numeric entries block Run rather than quietly using a default.

### 9.3 Household draft and independent 50-payment control

`src/config/constructors.ts` creates empty, sample, control and household drafts in the browser; the app offers only the empty and sample drafts, and the other two serve tests. No constructor reads a server-side user configuration. The separate household draft preserves $5.3M gross financial assets ($3.7M non-retirement with a placeholder all-cash allocation and $1.6M pre-tax), $2M property/$731k loans, user-selected FX 6.69 and RMB250,000 annual budget including RMB38,000 medical.

It leaves the real allocation, the after-tax/pre-tax split and the property basis/cash/tax/loan details incomplete, so it cannot run. B holds a green card but, like every non-citizen, is modeled as an NRA for now; real resident-alien treatment is not implemented. China domicile and medical/shock/care choices need adopted factual inputs. Source status remains separate from factual validation.

The development-only deterministic control (`verification/fixtures/control-pv.toml`) supplies literal return rows via `verification/market-tapes.ts` and starts in 2026, both born in 1986, with **Max age 89**, hence exactly 50 beginning-year payments at ages 40…89. Both remain alive. All wealth is brokerage cash earning a constant 3%, owned by two NRAs so the interest is US-exempt and no tax arises under the bundled tables. The household is US-domiciled with 4% US CPI, FX 6.69, zero spread and no shocks, care or properties. The budget is USD 37,369.21 (RMB250,000 / 6.69), including USD 5,680.12 (RMB38,000 / 6.69) of health with zero age growth/medical excess, so spending stays exactly that payment × the 4% price index.

```text
First payment = 250,000 / 6.69 = USD 37,369.20777279521
PV = sum(t=0…49) (250,000 / 6.69) × (1.04 / 1.03)^t
   = USD 2,390,572.9770677146
```

The separate FX control (`control-fx.toml`) keeps the USD budget with 3% returns and 3% US CPI while FX drifts by `log(.99)` a year; USD funding does not depend on FX, so its PV is exactly 50 payments, USD1,868,460.3886397605. Add tax/access, FX, medical growth/care/shocks and return variation separately when interpreting sensitivities.

Observed dot-com/2008 replay requires actual documented annual stock/bond/cash rows and the stated allocation. Amplified stress is labeled separately; a peak-to-trough equity fall is not a one-year diversified-portfolio calendar return. These arithmetic controls do not establish a household funding floor.

### 9.4 Current contracts and frozen M00 evidence

The [verification folder](../verification/README.md) keeps the original 80-case oracle catalog unchanged; the field mapping is `src/config/fields.json`, and the raw M00 reports are in git history at tag `verification-archive`. These are development assets excluded from production.

- `retire-canonical-v1`: recursively sorted ordinal UTF-16 object keys, preserved array/string order, finite JSON numbers, omitted undefined object leaves, rejected undefined array elements; SHA-256 of unindented UTF-8 canonical bytes.
- `retire-rng-v1` / `retire-draws-v4`: stable bootstrap/CPI/FX/medical-occurrence/spend-flex streams over T, no mortality or property stream. Switches or financial decisions do not change draw consumption; property IDs and path prefixes are stable.
- `retire-model-v6`: everyone alive to the younger (or single) Max age, three fixed accounts with derived ownership, non-citizens taxed as NRAs, single-source Budget medical with optional flexible spending, continuing always-additional care, pension/annuity income, no CNY cash, direct historical rows plus the explicit outlook shift, and nonpositive-net-worth stopping. The manifest records lifetime and stopping policies.
- `retire-results-v2`: 33 retained core ledger fields, five chart buffer fields and 17 Float64/5 Int32/3 Uint8 scalar fields (159 summary bytes/path). Former alive-flag, planned-spend, CNY-cash, estate/death/SS/state-tax/payment-credit slots are removed; `spend_mult` records the flexible-spending multiplier. `retire-ledger-report-v1` adds five replay/CSV fields.
- N=20,000/T=52 retains exactly 23,980,000 bytes; the shipped N=5,000/T=70 sample retains 7,795,000 bytes. The explicit performance fixture uses T=52. The 512 MiB preflight budgets modeled allocations/reserve, not OS browser RSS.
- The 55 original numeric answers stay frozen; the independent recalculation script is in git history. `npm test` applies 16 numeric cases, retires 39 obsolete cases and explicitly excludes the original deposit-rate and FX-stress subfields from `MARKET-TIMING`. Current units/browser tests cover replacement requirements without rewriting golden answers.
- The original control workbook (`verification/records/M00-2/control-calculations.xlsx`), raw fixtures and preparation notes are in git history at tag `verification-archive`. A retired case is never reported as passing.

---

## 10. Environment and dependencies

**Status:** Dependencies are pinned in `package.json` and `package-lock.json`; Node 24.22.0 is pinned in `.node-version` and as a dev dependency.

| Area | Choice |
|---|---|
| Development runtime | Node.js 24 (24.22.0 pinned) and npm 11 |
| Web app | React, React DOM, TypeScript, Vite; strict TypeScript settings and module Web Workers |
| Configuration | `smol-toml`, Zod; one parse/normalize/validate/export pipeline |
| Deterministic hashing | `@noble/hashes` SHA-256 for stream seeding/canonical hashes; no runtime `Math.random()` in the model |
| Charts | ECharts, wrapped by small React components |
| Verification | Vitest for model/unit tests; Playwright (Chromium) for browser flows; `tsx` for development scripts |
| Source workbooks | SheetJS 0.20.3 (BIFF8) for development-only `.xls` import; standard-library Python readers for independent checks (§4.1) |

- Pin verified dependencies in `package-lock.json`; document Node/npm/browser versions. A fresh `npm ci` must reproduce the build. No dependency version or laptop benchmark is assumed passed from the previous environment.
- Primary commands: `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`, `npm run preview`, `npm run test:e2e` and `npm run check` (the full gate). Data work uses `npm run data:fetch -- --output <directory>`, `npm run data:import -- --source-dir <local-directory>`, `npm run data:bundle` and `npm run data:verify`. `npm run serve` runs the production server with scheduled market refresh; `npm run market:refresh` runs one refresh.
- `dev` serves the app with the live market-data gateway. `build` produces `dist/` with the product interface and compiled app/worker/public-reference assets; fixture inputs, oracle adapters and raw source workbooks are excluded (`npm run verify:build`). Browser tests serve `dist/` through `scripts/serve-test-build.ts` at `/` and `/retire/`. End users need a supported browser, not Node.
- Initial support/acceptance browsers are current stable desktop Chrome and Safari on the named Apple M4 Pro. Record their exact versions and available memory. Use HTTPS or localhost; do not require users to launch the app from `file://`. Test module-worker asset paths in the production build.
- Default worker count is `max(1, (navigator.hardwareConcurrency || 2) - 1)` with 64-path chunks. Verification can set 1 or 4 workers and chunk size without changing the financial configuration. Memory preflight includes retained results and temporary aggregation storage; 100,000 paths remain an allowed input when the declared resource budget supports them.
- The static host needs no user-configuration files, environment secrets, user database or simulation service. Configuration uploads/downloads and computation stay in the browser. Load worker/reference assets before testing computation with the network disabled; initial app loading still needs available assets (§4.1).
- Development source acquisition uses downloaded local files and records provenance. Any needed trusted-CA setup belongs to development tooling; it is not a browser/runtime requirement. Raw workbook contents are verified before generating the bundled references.
- Commit public reference data/manifests, independent source receipts, lockfile and fixture oracles. Ignore dependencies, build output, local raw downloads, personal configuration exports and private acceptance artifacts. Existing environment directories are unrelated to the web-app runtime.

---

## 11. Testing

### 11.1 Hand-checked tax cases

The original independently calculated table is retained below. Only US-3 and RMD-1 still run (in `tests/oracles.test.ts`); every other row is **RETIRED** (`RETIRED_CASE_IDS` in `src/verification/cases.ts`): EST, MORT and DEATH under the fixed-lifetime model, US-1/2/4–8, NRA-1, CN-1/2 and TERMINAL-1 with the tax simplification, and FIRPTA-1 with the removal of withholding. Current same-year payment is pinned by engine unit literals instead; no archived death/estate/mortality/timing calculation is a current feature.


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

Also pin partial capital offsets and prior carryover ordering to the applicable worksheets and property sale classification to the supported split. Include final-horizon taxable sales/distributions and leftover unpaid bills. No test should assume that every US tax component is creditable.

### 11.2 Market realism checks

Raw NYU/FRED rows, population calibration, observed calendar crisis tapes and production-worker source identity are now checked independently. The broader empirical Monte Carlo expectations below remain OPEN until separately reproduced; they are not inferred from raw-source acceptance.


Defaults, N = 20,000, T = 40, fixed seed. Reproduce §4's provisional references from versioned data before finalizing statistical tolerances. Structural/domain checks below are independent of those provisional measurements.

- Mean simulated `us_stocks` is within ±0.3 percentage points (pp) of 11.85%; `us_bonds` within ±0.2 pp of 4.82%.
- Source fidelity: every selected US row remains unchanged in all configurations apart from the explicit outlook shift, including negative 2000–2002/2008/2022 returns; bounds follow the selected window.
- Removed projection/event fields never appear in current exports and are rejected as unknown keys on import.
- Domain failures reject invalid CPI/medical/combined-property factors before logs or balances; invalid full-horizon Gaussian market draws fail the whole job. No resampling or partial probability output.
- **FX drift mode.** With `fx_sigma = 0` and `fx_drift = −0.01`, `S[t] = fx_spot·e^{−0.01·t}` within 1e-12.
- P(nominal bond max drawdown > 35%) < 0.005, and P(> 50%) < 0.0005.
- China CPI: mean 1.7% ± 0.1 pp, SD 1.89% ± 0.1 pp, lag-1 autocorrelation 0.30 ± 0.03.
- FX: the SD of annual log changes lies in [4.4%, 5.1%].
  - Deterministic case: `fx_sigma = 0` with constant inflation (US 3%, China 1%). Then `log S − log P` converges to `−(1−λ)/λ·log(1.01/1.03)` within 0.002 by t = 60.

### 11.3 Current automated verification

- **Configuration/UI:** local UTF-8 upload/export/re-upload, strict unknown/finite/integer errors, missing/unsupported actual fields, random seed endpoints, all current fields, conditional care/flex/pension controls, Easy/Power guided setup, English/Chinese switching and Markets/Inflation/FX grouping. Typed `0.003` survives editing/export/run; external loads synchronize numbers. Retired Cash CNY rate/floor fields are rejected.
- **Fixed horizon:** different ages/seeds produce at most T rows, everyone alive throughout; solvent paths end at the younger (or single) Max age and exhausted paths stop earlier; the older can exceed it. Removed death/estate fields never reappear in current exports.
- **Medical:** RMB212,000 ordinary + RMB38,000 aggregate health once; combined price/age growth; shocks always additional; care starts at the earliest-born person's start age, continues through the horizon, is funded/shown in Medical and always enters additional consumption rather than included consumption.
- **Accounts/tax:** average basis/reinvestment/rebalance, derived ownership, access/RMD/FX journals, pension income with NRA/China treatment, long-term loss/carryover cases, early penalties, same-year tax payment and China credit provenance.
- **Property:** mortgage/depreciation/rental cash, feasible sales with no withholding, sale failure, last-resort order and hold/no-last-resort-sale. No inheritance or basis step-up event exists.
- **Engine:** test-only full 50-row PV/FX controls, early zero/negative net-worth stops (including empty initial portfolios), accessible-asset shortfalls with positive property equity, same-year final taxes and a sub-dollar leftover paid the next year. Literal controls (final-year heirs 491,382.02 and citizen sale 240,000 − 7,582.5 = 232,417.5) use bundled reference rates with no overrides and no withholding.
- **Workers/results:** seeded prefix/schedule/property-ID reproducibility, real transfers, Float64 Type 7 KPIs/comparison, stable ranking, whole-N funded cohorts, solver bisection, full-precision replay/38-column CSV with integer money display, cancellation/stale messages and whole-job factor failure.
- **Browser workflow:** sample upload/build/edit → real workers → results → pin/paired comparison → ledger/export → reload/re-upload; fresh loaded offline runs, local files/no config requests or storage, static directory mounts, server-managed market data and production exclusion of fixtures/oracle adapters.
- **Resources:** explicit T=52 benchmark with three runs each at 2,000 and 20,000 paths (10 s/90 s gates), 1,199 retained bytes per path (23.98 MB at 20,000) and measured browser RSS, recorded in `test-results/e2e/`. Check tab/input responsiveness and cancellation; reject oversized N/T/baseline combinations without lowering N. Ordinary sample T=70 is separate.

Frozen M00 answers remain independent of `src/model`. 39 superseded numeric cases are RETIRED; six of the seven broader conditional cases are OPEN (PROPERTY-1231 is retired), and the 18 structural cases are covered by unit/browser tests rather than the oracle runner.

### 11.4 Automated milestone acceptance

The app was built by following [the implementation plan](2026-10-18-retirement-sim.md) in M00–M11 dependency order, with automated criteria per step and no human checklist or signature. Failed financial checks block dependent integration; missing facts and unsupported tax branches block every configuration. Legal/history source status stays explicit in all runs and exports without a category-dependent execution gate. Observed NYU/FRED data exercises the shared workflow; independent raw-source/calibration and calendar 2000–2002/2008/2022 replay checks pass. Broader empirical calibration and primary legal-source scope remain separately OPEN. The per-step records were retired on 2026-10-30 and are in git history at tag `verification-archive`.

Acceptance now uses `npm run check`: oracle cases compare product results with frozen literal answers inside `npm test`, and the browser suite covers the complete user-facing sample workflow: local upload/build, worker computation, paired comparison, Float64 ledger/export, reload/re-upload, fresh offline workers and a static directory mount. Worker code is bundled into the initial assets; no simulation/configuration request or server scenario file is required.

Ordinary Chromium child-process launch and WebKit currently fail before app load on the execution host. Chromium testing uses a recorded single-process workaround; Safari/cross-browser acceptance stays OPEN. This limitation does not certify unavailable browser checks, historical rows, primary legal sources or the actual retained-green-card tax branch.

## 12. Model conventions and deliberate simplifications

| Convention | Consequence / possible extension |
|---|---|
| Everyone lives to the younger (or single) Max age, inclusive | Full fixed-horizon funding; no mortality, survivor, inheritance or estate model |
| No CNY cash account | CNY needs convert from USD at opening FX less the spread; a CNY deposit with interest could be added later |
| Single aggregate Budget medical base | No duplicate per-person base; configured medical age/price growth can raise real spending |
| Care always additional from the earliest-born person's start age through final year | Included consumption does not absorb care; medical/total/funding still include it |
| Annual beginning-year flows / same-year income-tax payment | Withdrawal capital earns no current-year return; leftover unpaid tax is a memo deduction at the stop |
| Constant stock/bond income yields; reinvestment | Taxable income decomposition uses declared yields rather than historical distribution columns |
| All securities gains long-term; average basis | Short-term/lot/wash-sale modeling is deferred; all property gains use LTCG rates (no §1250 bucket) |
| Unchanged observed US history / Gaussian China CPI and FX | All configurations use historical returns, without a 3% target, plus an optional explicit outlook shift; China/FX source histories supply calibration references; invalid factors fail whole runs |
| Every non-citizen, including a green-card holder, is taxed as an NRA for now | Real-world green-card holders are US tax residents; the resident-alien/treaty-residency branch remains unimplemented |
| Derived account ownership; brokerage basis equals balance at start | No per-account owner/share/basis inputs; embedded starting gains are not modeled |
| Optional flexible spending keyed to the prior year's nominal portfolio return | Guardrails only; medical, shocks, care and one-time costs never flex |
| Pension/annuity is ordinary US income, never taxed by China | Flat NRA `own_pension` rate (0) for nonresidents; no survivor or lump-sum options |
| Social Security excluded | No benefits, inputs, earnings-history/claim optimizer or survivor entitlement |
| China gain conversion / CPI tax-table indexing / no state tax | Original simplifying accounting policies remain disclosed and source-gated |
| Leftover unpaid tax deducted once at the stop | No refunds or prepayments exist; the memo is not cash paid |
| Float64 calculations/scalars; Float32 chart series | Display/chart precision does not determine taxes, depletion or full-precision CSV |
| Static local app and in-memory sessions | Users save with downloads and re-upload after reload; client resources limit scale |

---

## 13. Risks and open acceptance

- Actual household allocations/retirement split, rental/loan/tax inputs and medical amounts still need factual completion. B holds a green card but is modeled as an NRA, like every non-citizen; the resident-alien income branch is not implemented, so B's US tax can differ from real-world resident treatment.
- The broad primary-source audit and applicable cross-border payment/FTC/benefit rules remain OPEN. The scoped 2025 capital-gains worksheet evidence does not certify the whole tax model.
- Raw NYU/FRED history, population calibration and actual dot-com/2008/2022 calendar tapes are checked. Broader empirical Monte Carlo distribution targets remain OPEN; historical averages do not enforce a conservative 3% return assumption.
- Chromium verification uses this host's single-process launch workaround. Ordinary browser child-process/WebKit launch fails before app load here; Safari/cross-browser acceptance remains OPEN.
- Resource preflight estimates known allocations, not an OS process-memory cap. Actual measurements come from the browser performance test (`test-results/e2e/`).

These items do not create a Simulation metadata gate. Required financial fields and supported combinations govern Run for every configuration; source status is reported separately.
