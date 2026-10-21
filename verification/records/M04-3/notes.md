# M04.3 — Implement China CPI, FX, indices and derived growth

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

China AR CPI and FX drift/PPP/noise use S[0..T] and opening/ending indices; FX stress events and CNY interest are removed. Original applicable timing answers and legacy-field invariance pass.

## Implementation

- [src/model/market.ts](../../../src/model/market.ts)
- [tests/market-data.test.ts](../../../tests/market-data.test.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)

Case results: MARKET-TIMING: PASS; MARKET-AR: PASS; MARKET-INVALID: PASS.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
