# Current model and configuration contracts

Written 2026-10-18; updated 2026-10-30. The browser app is implemented; human acceptance checklists are retired. [The spec](../plan/2026-10-18-retirement-sim-design.md), [types](../src/model/types.ts), [field inventory](../src/config/fields.json) and [result layout](../src/model/layout.ts) define the current contract. The frozen M00 oracles remain in [fixtures/oracles.json](fixtures/oracles.json).

## 1. Ownership and boundaries

```text
Local TOML / browser builder / guided setup -> DraftScenario
    -> normalize + common validation + static references (+ server market-data package)
    -> immutable RunRequest / ScientificManifest
    -> bounded simulation workers -> transferred compact arrays
    -> analysis worker -> summaries / replay / paired comparison
    -> React views / local TOML, manifest, provenance and CSV downloads
```

| Module | Responsibility |
|---|---|
| src/config/schema.ts, config.ts | Strict known types, normalization, derived tax status/ownership, required fields, supported combinations, immutable snapshots |
| src/config/constructors.ts, fields.json, downloads.ts | In-code starters, shared field metadata, local exports |
| src/components/Builder.tsx, ConfigField.tsx, NumberInput.tsx, Tutorial.tsx, AdvancedGuide.tsx | Fixed-by-asset income treatment, Easy/Power guided setup, plain-English hover/focus/tap help, wheel-safe decimal editing and synchronized external values |
| src/model/rng.ts, canonical.ts, market.ts | Versioned latent streams, hashes, admissible joint annual markets/CPI/FX/medical indices, outlook shift |
| src/model/consumption.ts, preview.ts | Ordinary Budget with optional flexible-spending multiplier, single aggregate medical base, shocks and continuing additional care |
| src/model/accounts.ts, property.ts | Access/basis/withdrawals/RMD, rent/mortgage/depreciation/sale journals |
| src/model/tax.ts, engine.ts | Supported income tax/same-year credit, pension income, ten-phase funding loop and ending memo for leftovers |
| src/model/layout.ts, results.ts, comparison.ts, solver.ts | Retained compact buffers, whole-N cohorts, Float64 Type7/ranking/differences, what-would-it-take solvers |
| src/workers/ | Real worker transfers, bounded chunks, stale-run guards, cancellation and whole-job failure |
| src/reference/market-data.ts, scripts/market-data-*.ts, scripts/serve.ts | Market-data package validation, read-only `GET api/market-data` gateway and scheduled server refresh |
| src/i18n/ | English and Chinese UI text with live switching |

User configurations are selected local files or memory objects. Public references are compiled app assets; a host running the gateway can replace the market-data package. Development fixtures and oracle adapters are excluded from production (`npm run verify:build` checks this). No configuration API, server scenario directory or automatic browser persistence is part of the contract.

## 2. Current input contract

The 86 metadata paths in `fields.json` are internal and TOML paths, with explicit units/control/omission/default/ranges. Draft blanks remain omitted; finite/integer/type errors do not become 0. Structurally valid incomplete drafts export/re-import with missing inputs intact. All scenarios use the same required-value and supported-combination checks; source status does not create a category/checkbox gate.

- Simulation: start_year/n_paths/seed/max_age only. Optional defaults are explicit (5,000 paths, seed 42, Max age 110); required financial facts remain missing.
- People: Person A (required) and Person B (optional) with birth_year, US citizenship (unchecked means non-citizen) and an optional pension/annuity (annual USD, start age, US-CPI COLA on by default), plus one US/China household domicile. `us_income_tax_status` is derived from citizenship when omitted. Every non-US citizen, including a green-card holder, is an NRA for now. The retired descriptive `sex` is accepted but has no effect. No People medical base/mortality/survivor/estate fields.
- Budget: annual and included_health, plus optional flexible spending (flex_enabled, flex_cut, flex_raise; cut and raise default to 0.15). Every budget uses initial treatment and there is no budget mode. Ordinary base is annual minus included health. Included health is the household's single medical base.
- Medical: aggregate-base age growth, per-person shock controls and late_life_care(enabled,start_age,monthly,real_growth). Care is always additional through the final horizon and starts when the earliest-born person reaches the start age. No end_age, care budget_scope or age selector.
- Social Security is excluded: no benefits are ever paid and there are no Social Security inputs. Pensions are separate per-person income.
- Markets group contains the sampling window (History era presets or a custom range), bootstrap, outlook_shift (−0.1…0.1, added to stock and bond returns) and stock/bond yield controls; Inflation contains China/medical price settings; FX contains exchange-rate settings. Cash account types and their rate/floor fields are removed; CNY spending converts from USD at opening FX less the spread.
- One-time costs have a name, year, amount and CNY/USD currency, and are always additional. There is no recurring-spending list.
- Three fixed accounts in withdraw order (brokerage, after-tax, pre-tax) carry no income declarations: stocks pay qualified dividends, bonds pay coupon interest with zero-gain sales, cash earns money-market interest. All income is US source; NRA treatment is dividends on equity and exempt interest otherwise. Ownership is derived (even split with two people, full A with one); brokerage starts with basis equal to its balance; surplus cash and sale proceeds always land in brokerage. Property strategies are hold and sell-year (sell in the first year at or after `sell_year`), with no death-triggered sale. `share_A` is derived from household size when omitted; `label` is an editor-only name.
- Supported income branches are citizen/resident and noncitizen/nonresident. By policy, for now, every non-citizen, including a green-card holder, is taxed as an NRA; omitted status follows citizenship. The resident-alien branch is not implemented, so an explicit noncitizen/resident combination blocks Run. One household domicile routes China tax for every member.
- There are no tax overrides: every configuration uses the same bundled reference tables. No estate table or estate calculation exists; estate figures survive only inside the frozen oracle file.

Retired fields are rejected as unknown keys on import; there is no migration path. The one exception is `properties[].proceeds_account`, which is dropped so older files keep loading. Versionless files are rejected. Imports never mutate the supplied object.

Retired holding maps/links, account type names, other property fields, Social Security inputs, and the tax and tax_tables sections are rejected as unknown keys on import.

All configuration inputs have plain-English hover/focus/tap help, including conditional fields and list cells. Escape/outside clicks dismiss popups, which stay within the viewport and do not alter values. Numeric fields preserve decimal text and keyboard editing; the wheel guard prevents focused native stepping without losing focus.

### Public market data and removed controls

US returns/CPI/home values use source rows unchanged apart from the explicit, default-zero outlook shift; Custom mean/vol and FX-stress event controls/calculations are removed. Retired Custom/FX-stress fields are rejected as unknown keys on import. Literal constant-return reference rows exist only under verification for the original PV/accounting oracles.

The server refreshes NYU returns/dividends and FRED US CPI/China CPI/FX/DGS10 on a schedule (`npm run serve` or the Docker image, every 720 hours by default) and serves the validated package at a read-only `GET api/market-data`. The endpoint accepts no parameters, body or financial inputs and stores no configs. The app loads it once on start; there is no user refresh button and no market-data upload. All five sources must validate and pass the independent Python check before the package is swapped; failures keep the previous package. Dev/preview hosts fetch the sources live through the same gateway. Static hosts without the gateway use the bundled package. Configs stay browser-owned.

The sourced stock yield is 0.01335854176478289 (NYU 2025 dividends 78.57 / beginning index 5881.63); the bond input is 0.051 (DGS10 par yield, 2026-10-15). They replace undated 0.013/0.042 examples and split total return without adding growth. A par yield is an income proxy, not an existing portfolio coupon. Applying a package sets yields/spot FX, updates history/calibration data, keeps risk/budget/allocation settings and extends only a window that ended at the previous latest year.

Every completed run retains immutable references for replay/export/pinning. Its manifest contains the market package/hash; package scientific hash excludes retrieval timestamps. The app cannot load a downloaded package back, so a saved TOML reruns identically only while the same package is active. Changed data hashes make comparisons unpaired. Fresh provider updates are validated, not silently claimed independently audited; frozen shipped raw cells/yields have independent receipts.

## 3. Scientific snapshot and randomness

Scientific manifests include normalized-scenario/table/reference hashes, build version, seed/N/start ages/T/property IDs and source status:

| Identifier | Current value |
|---|---|
| Manifest / canonical | retire-manifest-v1 / retire-canonical-v1 |
| Model | retire-model-v6 |
| RNG / draw convention | retire-rng-v1 / retire-draws-v4 |
| Lifetime policy | both-alive-to-younger-max-age |
| Stopping policy | younger-max-age-or-nonpositive-net-worth |
| Public market data | retire-market-data-v1 |
| Result / annual ledger report | retire-results-v2 / retire-ledger-report-v1 |

Canonicalization sorts object keys in ordinal UTF-16 order, preserves arrays/strings, serializes finite JSON numbers, omits undefined object leaves and rejects undefined array elements. SHA-256 hashes unindented UTF-8 bytes. Execution environment/worker/timing metadata is separate from scientific inputs.

RNG uses SHA-256 of the tuple (version, seed, pathId, component, entityId), first 16 bytes as little-endian uint32 state, xoshiro128**, all-zero fallback and open uniforms `(uint32+.5)/2^32`. Box–Muller is cosine then sine. Streams are `bootstrap`, `cn_cpi`, `fx`, per-person `medical_occurrence` and `spend_flex`. Bootstrap consumes initial candidate then fixed jump/candidate pairs. Full-horizon draws exist before finances; switches/expenses/worker scheduling do not shift them, and adding paths never changes earlier paths. Property growth is deterministic, so property IDs only identify compatible runs. No mortality draw exists.

## 4. Horizon and annual accounting

`T = max_age - min(present start ages) + 1` for one or two people. Everyone is alive in every row; the younger ends at Max age, inclusive. The older may exceed it. Max age must be at least the younger start age, or the single start age. An absent Person B reports age_B=-1 and zero B taxes; one person uses single-filer US schedules while two use married filing separately. Start 2026/both 40/Max 89 gives 50 years; start 2027/both 41/Max 110 gives 70. There are no death events. T is an upper bound; nonpositive starting net worth stops before cash flows, and nonpositive year-end net worth stops after that year.

The ten phases are start, property strategies, rent/RMD/pension, consumption, funding living needs, returns, rebalance, compute income taxes, pay income taxes, and ending horizon/ledger. Opening withdrawals earn no current-year return. Net worth is USD accounts + property equity after mortgages at current boundary FX. Paths stop when it is nonpositive. Liquidity shortfalls alone do not stop a positive-net-worth path. Taxes are computed and paid the same year with iteration; leftover unpaid tax is a terminal memo deduction. A fully funded final Max-age year may spend the last dollar without a funding failure. Replays record stop reason/year/index/net worth; later ledger/chart buffer slots are NaN and no future financial years run. Cohort wealth percentiles use zero for stopped paths afterward.

Ordinary spending is `(annual-included_health)*home_index[t]*spend_mult[t]` (USD index when domicile is US; `spend_mult` is 1 unless flexible spending is on). Aggregate medical base is `included_health*(1+age_growth)^t*medical_index[t]`. Shocks use separate person ages/draws and cost `shock_median*medical_index[t]`; continuing care uses `monthly*12*medical_index[t]*(1+real_growth)^t` from the selected start age. Price and medical indices follow domicile (home vs USD). Care enters Medical/actual total/additional/funding once and never enters included consumption. Pensions pay `annual` (times the US index with COLA) from the start age as ordinary US income that China does not tax.

Cash account types are retired, and their ledger columns are removed. Stock/bond yields decompose sampled total returns into taxable income/reinvested basis rather than extra investment growth.

Capital netting retains losses/carries with all property gains at LTCG rates; the §1250 25% bucket is intentionally not modeled and its former scoped evidence is in git history at tag `verification-archive`. Section 1231 history and lookback are removed; broader cross-border source acceptance remains OPEN.

At the age or net-asset stopping boundary, memorandum after-tax assets subtract leftover unpaid income tax once at ending FX. Previously paid cash is already out of assets. Leftover tax does not disappear and the memorandum is not actual cash paid. No estate event/transfer/basis step-up occurs.

## 5. Output compatibility and precision

The v2 layout retains 33 core ledger fields, 5 chart fields and 17 Float64/5 Int32/3 Uint8 summary fields (159 scalar bytes/path). Former alive-flag, planned-spend, CNY-cash, estate/death/SS/state-tax/payment-credit slots are removed; `spend_mult` records the flexible-spending multiplier. Heirs labels mean ending after-income-tax assets.

Five annual replay/report fields produce 38 CSV columns with only simulated years: opening liquid USD, opening nominal net worth CNY, nonmedical spend, full Medical and weighted annual financial return. Provenance splits medical base/shocks/care. Financial return values after beginning-year flows at opening FX, before tax/FX, with property excluded; no capital gives missing return.

UI money is integer text; FX/indices retain decimals and returns are percentages. Engine money/taxes/decisions/scalars/replay/CSV remain Float64. Chart bands are Float32 visualization data. Whole-N fixed cohorts, Type7 quantiles and stable representative ranking apply; compatible paired runs use full-precision per-path current-minus-baseline deltas.

At 20,000 paths/T52, retained results are 23,980,000 bytes. The 5,000-path/T70 sample retains 7,795,000 bytes. Full ledgers are selected-path replays. Preflight counts modeled arrays/workspace/baselines/reserve under 512 MiB; measured full-browser RSS is separate.

## 6. Verification and source boundaries

Current `src/reference/source-gates.json` has 15 whole-rule unverified rows with scoped 2025 IRS capital evidence recorded separately. The original 18-row M00 source registry, case catalog, raw pre-fixed-horizon fixtures, preparation reports and milestone evidence are in git history at tag `verification-archive`; the 55 independent answers stay in `fixtures/oracles.json`.

`npm test` runs the 16 still-applicable numeric oracle cases against product modules; the other 39 numeric cases are retired. MARKET-TIMING excludes its old deposit-rate and FX-stress subfields. Replacement fixed-horizon/medical/care/pension/flex/SS/decimal behaviors have independent literal integration and real Chromium tests.

`npm run check` builds the app and runs the unit, data, static-build and browser checks. It verifies the supported example with observed NYU/FRED history, independent raw-source/population checks and calendar dot-com/2008/2022 replays. Actual household facts, broad primary rules, broader Monte Carlo calibration targets and Safari/process-launch scope remain open.
