# Current model and configuration contracts

Date2026-10-18. The browser app is implemented; human acceptance checklists are retired. [The spec](../plan/2026-10-18-retirement-sim-design.md), [42-step plan](../plan/2026-10-18-retirement-sim.md), [types](contracts.d.ts), [78-field matrix](config-field-matrix.md) and [result layout](result-layout.json) define the current contract. Original M00 notes/oracles remain independent historical evidence.

## 1. Ownership and boundaries

```text
Local TOML / browser builder -> DraftScenario
    -> normalize + common validation + static references
    -> immutable RunRequest / ScientificManifest
    -> bounded simulation workers -> transferred compact arrays
    -> analysis worker -> summaries / replay / paired comparison
    -> React views / local TOML, manifest, provenance and CSV downloads
```

| Module | Responsibility |
|---|---|
| src/config/schema.ts, config.ts | Strict known types, normalization, required fields, supported combinations, immutable snapshots |
| src/config/constructors.ts, fields.json, downloads.ts | In-code starters, shared field metadata, local exports |
| src/components/Builder.tsx, ConfigField.tsx, NumberInput.tsx | Fixed-by-asset income treatment, plain-English hover/focus/tap help, wheel-safe decimal editing and synchronized external values |
| src/model/rng.ts, canonical.ts, market.ts | Versioned latent streams, hashes, admissible joint annual markets/CPI/FX/medical indices |
| src/model/consumption.ts, preview.ts | Ordinary Budget, single aggregate medical base, shocks and continuing additional care |
| src/model/accounts.ts, property.ts | Access/basis/withdrawals/RMD, zero CNY interest, rent/mortgage/depreciation/sale journals |
| src/model/tax.ts, engine.ts | Supported income tax/same-year credit, ten-phase funding loop and ending memo for leftovers |
| src/model/layout.ts, results.ts, comparison.ts | Retained compact buffers, whole-N cohorts, Float64 Type7/ranking/differences |
| src/workers/ | Real worker transfers, bounded chunks, stale-run guards, cancellation and whole-job failure |

User configurations are selected local files or memory objects. Public references are compiled app assets; development fixtures/harness are excluded from production. No configuration API, server scenario directory or automatic browser persistence is part of the contract.

## 2. Current input contract

The87 metadata paths are internal and TOML paths, with explicit units/control/omission/default/ranges. Draft blanks remain omitted; finite/integer/type errors do not become0. Structurally valid incomplete drafts export/re-import with missing inputs intact. All scenarios use the same required-value and supported-combination checks; source status does not create a category/checkbox gate.

- Simulation: start_year/n_paths/seed/max_age only. Optional defaults are explicit; required financial facts remain missing.
- People: Person A (required) and Person B (optional) with birth_year, optional descriptive sex, citizenship and US income-tax residency, plus one US/China household domicile. No People medical base/mortality/survivor/estate fields.
- Budget: annual and included_health; every budget uses initial treatment and there is no budget mode. Ordinary base is annual minus included health. Included health is the household's single medical base.
- Medical: aggregate-base age growth, per-person shock controls and late_life_care(enabled,start_age,monthly,real_growth). Care is always additional through the final horizon and starts when the earliest-born person reaches the start age. No end_age, care budget_scope or age selector.
- Social Security is excluded: no benefits are ever paid and there are no Social Security inputs.
- Markets group contains sampling/bootstrap/stock-bond yield controls, Inflation contains China/US/medical price settings, FX contains exchange-rate settings. Cash account types and their rate/floor fields are removed; CNY spending converts from USD at opening FX.
- One-time costs retain currency and included/additional scope. There is no recurring-spending/flex input.
- Three fixed accounts in withdraw order (brokerage, after-tax, pre-tax) carry no income declarations: stocks pay qualified dividends, bonds pay coupon interest with zero-gain sales, cash earns money-market interest. All income is US source; NRA treatment is dividends on equity and exempt interest otherwise. Ownership is derived (even split with two people, full A with one); surplus cash always lands in brokerage. Property strategies are hold/sell-year/liquid-threshold, with no death-triggered sale.
- Supported income branches are citizen/resident and noncitizen/nonresident. Noncitizen/resident is unsupported; it is not automatically NRA. One household domicile routes China tax for every member.
- There are no tax overrides: every configuration uses the same bundled reference tables. The static estate snapshot is historical only; no estate scenario calculation exists.

Retired fields are rejected as unknown keys on import; there is no migration path. Versionless files are rejected. Imports never mutate the supplied object.

Retired holding maps/links, account type names, property fields, Social Security inputs, and the tax and tax_tables sections are rejected as unknown keys on import.

All configuration inputs have plain-English hover/focus/tap help, including conditional fields and list cells. Escape/outside clicks dismiss popups, which stay within the viewport and do not alter values. Numeric fields preserve decimal text and keyboard editing; the wheel guard prevents focused native stepping without losing focus.

### Public market data and removed controls

US returns/CPI/home values use source rows unchanged; Custom mean/vol and FX-stress event controls/calculations are removed. Retired Custom/FX-stress fields are rejected as unknown keys on import. Literal constant-return reference rows exist only under verification for the original PV/accounting oracles.

The homepage manually refreshes NYU returns/dividends and FRED US CPI/China CPI/FX/DGS10 through a fixed-public-URL JS gateway. It accepts only a GET without parameters/body or financial inputs and stores no configs. All five sources must validate before application. Failure/cancellation preserves the latest draft and references. Configs stay browser-owned, including on static hosts where market data package upload/download is available.

The sourced stock yield is0.01335854176478289 (NYU2025 dividends78.57 / beginning index5881.63); the bond input is0.051 (DGS10 par yield,2026-10-15). They replace undated0.013/0.042 examples and split total return without adding growth. A par yield is an income proxy, not an existing portfolio coupon. Refresh applies yields/spot FX, updates history/calibration data, keeps risk/budget/allocation settings and only extends a previously full-history window.

Every completed run retains immutable references for replay/export/pinning. Its manifest contains the market package/hash; package scientific hash excludes retrieval timestamps. Download run market data + TOML and upload in that order after reload. Changed data hashes make comparisons unpaired. Fresh provider updates are validated, not silently claimed independently audited; frozen shipped raw cells/yields have independent receipts.

## 3. Scientific snapshot and randomness

Scientific manifests include normalized-scenario/table/reference hashes, build version, seed/N/start ages/T/property stream IDs and source status:

| Identifier | Current value |
|---|---|
| Manifest / canonical | retire-manifest-v1 / retire-canonical-v1 |
| Model | retire-model-v5.1 |
| RNG / draw convention | retire-rng-v1 / retire-draws-v3 |
| Lifetime policy | both-alive-to-younger-max-age |
| Cash CNY policy | no-interest |
| Stopping policy | younger-max-age-or-nonpositive-net-worth |
| Public market data | retire-market-data-v1 |
| Result / annual ledger report | retire-results-v1 / retire-ledger-report-v1 |

Canonicalization sorts object keys in ordinal UTF-16 order, preserves arrays/strings, serializes finite JSON numbers, omits undefined object leaves and rejects undefined array elements. SHA-256 hashes unindented UTF-8 bytes. Execution environment/worker/timing metadata is separate from scientific inputs.

RNG uses SHA-256 of the tuple(version,seed,pathId,component,entityId), first16 bytes as little-endian uint32 state, xoshiro128**, all-zero fallback and open uniforms `(uint32+.5)/2^32`. Box–Muller is cosine then sine. Bootstrap consumes initial candidate then fixed jump/candidate pairs. Full-horizon CPI/FX/medical/property draws exist before finances; switches/expenses/worker scheduling do not shift them. Property IDs and path prefixes stay stable. No mortality draw exists.

## 4. Horizon and annual accounting

`T = max_age - min(present start ages) + 1` for one or two people. Everyone is alive in every row; the younger ends at Max age, inclusive. The older may exceed it. Max age must be at least the younger start age, or the single start age. An absent Person B reports age_B=-1, alive_B=0 and zero B taxes; one person uses single-filer US schedules while two use married filing separately. Start2026/both40/Max89 gives50 years; start2027/both41/Max110 gives70. There are no death events. T is an upper bound; nonpositive starting net worth stops before cash flows, and nonpositive year-end net worth stops after that year.

The ten phases are start, property strategies, rent RMD, consumption, funding living needs, returns, rebalance, compute income taxes, pay income taxes, and ending horizon/ledger. Opening withdrawals earn no current-year return. Net worth is USD accounts + property equity after mortgages at current boundary FX. Paths stop when it is nonpositive. Liquidity shortfalls alone do not stop a positive-net-worth path. Taxes are computed and paid the same year with iteration; leftover unpaid tax is a terminal memo deduction. A fully funded final Max-age year may spend the last dollar without a funding failure. Replays record stop reason/year/index/net worth; later ledger/chart buffer slots are NaN and no future financial years run. Cohort wealth percentiles use zero for stopped paths afterward.

Ordinary spending is `(annual-included_health)*home_index[t]` (USD index when domicile is US). Aggregate medical base is `included_health*(1+age_growth)^t*medical_index[t]`. Shocks use separate person ages/draws; continuing care uses `monthly*12*medical_index[t]*(1+real_growth)^t` from the selected start age. Price and medical indices follow domicile (home vs USD). Care enters Medical/actual total/additional/funding once and never enters included consumption.

Cash account types are retired; the cny_cash_cny and withdraw_cny ledger columns stay zero for layout compatibility. Stock/bond yields decompose sampled total returns into taxable income/reinvested basis rather than extra investment growth.

Capital netting retains losses/carries with all property gains at LTCG rates; the §1250 25% bucket is intentionally not modeled and its former scoped evidence is archived. Section 1231 history and lookback are removed; broader cross-border source acceptance remains OPEN.

At the age or net-asset stopping boundary, memorandum after-tax assets subtract leftover unpaid income tax once at ending FX. Previously paid cash is already out of assets. Leftover tax does not disappear and the memorandum is not actual cash paid. No estate event/transfer/basis step-up occurs.

## 5. Output compatibility and precision

The v1 layout retains37 core ledger fields,7 chart fields and17 Float64/5 Int32/3 Uint8 summary fields (159 scalar bytes/path). Former flex/estate/death/SS/state-tax/payment-credit slots are removed; alive flags remain with absent-person sentinels. Heirs labels mean ending after-income-tax assets.

Five annual replay/report fields produce42 CSV columns with only simulated years: opening liquidUSD, opening nominal networthCNY, nonmedical spend, full Medical and weighted annual financial return. Provenance splits medical base/shocks/care. Financial return values after beginning-year flows at opening FX, before tax/FX, with CNY zero interest and property excluded; no capital gives missing return.

UI money is integer text; FX/indices retain decimals and returns are percentages. Engine money/taxes/decisions/scalars/replay/CSV remain Float64. Chart bands are Float32 visualization data. Whole-N fixed cohorts, Type7 quantiles and stable representative ranking apply; compatible paired runs use full-precision per-path current-minus-baseline deltas.

At20,000 paths/T52, retained results are32,300,000 bytes. The sample200/T70 retains423,800 bytes. Full ledgers are selected-path replays. Preflight counts modeled arrays/workspace/baselines/reserve under512 MiB; measured full-browser RSS is separate.

## 6. Verification and source boundaries

Current `src/reference/source-gates.json` has15 whole-rule unverified rows with scoped2025 IRS capital evidence recorded separately. The original18-row M00 source registry,80-case catalog,55 independent answers, raw pre-fixed-horizon fixtures and preparation reports remain archived.

Current product comparison has33 applicable numeric cases and23 RETIRED. MARKET-TIMING excludes its old deposit-rate and FX-stress subfields. Six broader cases remain OPEN and18 structural cases are SUITE with separate browser/unit coverage. Replacement fixed-horizon/medical/care/zero-interest/SS/decimal behaviors have independent literal integration and real Chromium tests.

`npm run check` produces current evidence, all42 milestone records and release hashes. It verifies the supported example with observed NYU/FRED history, independent raw-source/population checks and calendar dot-com/2008/2022 replays. Actual household facts, broad primary rules, broader Monte Carlo calibration targets and Safari/process-launch scope remain explicit in [implementation status](implementation-status.md).
