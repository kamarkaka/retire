# M05.4 — Implement account journals, access, RMD and FX funding

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Fixed-by-asset income treatment retains tax classification without adding yield to total return. Access, basis, reinvestment, rebalancing, attribution, RMD and FX funding pass independent journals. Cash CNY earns zero interest.

## Implementation

- [src/model/accounts.ts](../../../src/model/accounts.ts)
- [src/model/engine.ts](../../../src/model/engine.ts)
- [tests/accounts.test.ts](../../../tests/accounts.test.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)
- [e2e/chromium-simplified-accounts.json](../e2e/chromium-simplified-accounts.json)

Case results: RMD-1: PASS; ACCOUNT-BASIS: PASS; ACCOUNT-REBALANCE: PASS; ACCOUNT-ACCESS: SUITE; CONVERSION-1: PASS.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
