# M08.3 — Verify final bills, prior bills, refunds and payment order

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Real engine fixtures yield 500k assets minus30k unpaid tax=470k ending after-tax assets, prior tax funded from traditional accounts=464k, and FIRPTA90k cash plus130k confirmed refund=220k. No tax stub, artificial final cash remittance or hidden initial settlement.

## Implementation

- [src/model/engine.ts](../../../src/model/engine.ts)
- [src/model/settlements.ts](../../../src/model/settlements.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)

Case results: ENGINE-FINAL-TAX: RETIRED; ENGINE-PRIOR-TAX: RETIRED; ENGINE-FIRPTA: RETIRED.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
