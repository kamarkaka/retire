# Current review traceability

The app is implemented with automated acceptance; original M00 inputs/oracles remain archived. Subsequent user revisions replace mortality/estate/survivor/recurring/flex inputs with fixed lifetimes, ordinary Budget and continuing always-additional Medical care. [Current execution](records/product-cases.json) and [milestone records](implementation-status.md) distinguish applicable, RETIRED, OPEN and SUITE scope.

## R1–R8 decisions and current ownership

| Review | Current contract / module | Independent evidence and scope |
|---|---|---|
| R1 capital netting | tax.ts: raw long-term net total, ordinary loss deduction/carry; property gains use LTCG rates | Frozen US-CARRY answer plus unit netting cases; former §1250 worksheet cases US-4/5/6/7/8 are RETIRED and scoped IRS evidence is archived. Broad CAPITAL-PARTIAL remains OPEN. |
| R2 property-sale tax | property.ts/engine.ts: feasible closing cash/contributions, ECI tax computed and paid the same year | ENGINE-FIRPTA retired; engine literal pins $7,582.50 same-year ECI tax with $232,417.50 ending assets. Rate/transaction source acceptance remains OPEN. |
| R3 same-year tax payment | engine.ts: bills computed and paid the same year with iteration; sub-dollar leftover carries; terminal memo deducts leftovers | TERMINAL-1/REFUND/DEFICIT and ENGINE-FINAL-TAX/PRIOR-TAX are RETIRED. Engine literals pin 467455.28/232417.50 endings with fixpoint convergence. No death event or estate liability is generated. |
| R4 same-year China credit | tax.ts: China bill net of same-year eligible US-paid credit; no vintages or carryforward | CN-2/PARTIAL/WITHHOLDING are RETIRED. Unit traces pin same-year credit math ($15,360 raw less $8,066 eligible = $7,294 due). Expiry/refund legal scope remains OPEN. |
| R5 explicit income classifications | config.ts/accounts.ts/tax.ts: citizenship, US income residency, China domicile, holding income treatment | Required/unsupported status tests and preserved household gross facts; retained green card cannot silently become NRA. Estate domicile/situs/wrapper gates are removed with estate processing. |
| R6 admissible markets | market.ts: joint source rows, population projection moments and factor preflight | MARKET-JOINT/PROJECTION/TIMING/AR/INVALID, seeded schedule/prefix tests and whole-job failure. All 98 joint NYU/FRED years and China/FX calibration references are checked independently; actual dot-com/2008/2022 return tapes pass through the engine. CNY deposit-rate calculation is removed; MARKET-TIMING explicitly excludes its old deposit-rate subfield. Broader empirical Monte Carlo targets remain OPEN. |
| R7 medical counted once | consumption.ts/config.ts: single Budget included_health, aggregate medical growth/shocks and care always additional | Literal212k+38k=250k, medical-growth/scope cases and continuing-care unit/browser trace. There is no People base/recurring list; care has no end/scope and contributes to additional/funding/Medical. Old duplicate-entry BUDGET-1/flex/window cases are RETIRED. |
| R8 Social Security removed | tax.ts/engine.ts/Builder.tsx: no SS inputs, benefits, taxation or People controls | No SS unit matrix or browser surface remains; SS-dependent oracles US-1/2 and NRA-1 are RETIRED. Actual entitlement/overseas rules remain household/source facts. |

## Current user revisions

| Requirement | Code / automated evidence |
|---|---|
| Both alive until younger Max age, inclusive | config.ts/market.ts/engine.ts; engine unit tests and chromium-fixed-horizon.json; A64/B62 final row for Max62 |
| Example A1986/F/citizen/CN and B1986/M/noncitizen/CN | Current constructors/templates; builder and exported example assertions |
| Group Markets / Inflation / FX | Builder.tsx with original schema paths; browser checks every group field location |
| Decimal input such as0.003 | NumberInput.tsx preserves numeric text; sequential browser entry/export/run/external-import checks |
| Single Budget medical base and continuing additional care | consumption.ts and medical_detail provenance; included vs additional raw ledger reconciliation |
| Social Security fully removed | tax.ts/engine.ts/inventory; SS tax plumbing deleted and SS-dependent oracles RETIRED |
| Remove CNY real-rate/floor/interest, keep explanatory note | market.ts/accounts.ts/engine.ts;100k nominal CNY-only engine oracle, zero taxable income/return, legacy field removal and Markets-note browser assertions |
| Integer ledger money with full-precision calculations/export | Ledger.tsx/downloads.ts;50-year PV integer UI and Float64 CSV assertions |
| Section 1250 ordering removed; property gains use LTCG rates | tax.ts/engine.ts; §1250 oracles RETIRED, scoped IRS evidence archived, shipped-example sale/loss Chromium regression |

## Evidence boundaries

All42 original M00–M11 IDs remain in the current plan. Original55 reference answers are untouched;18 numerical product comparisons are applicable,37 retired,6 broader source/data cases open and18 structural labels are SUITE. Current source registry has15 whole-rule unverified rows; the original18-row registry stays archival. Numeric arithmetic, observed data, broad legal acceptance and actual household facts remain separate claims.

Current manifests identify model-v5.1, fixed lifetimes, zero-interest CNY cash, unchanged RNG-v1/draw-v2 and retained result-layout-v1. Full source/configuration/evidence hashes are in [release](records/release.json) and [evidence manifest](records/evidence-manifest.json).
