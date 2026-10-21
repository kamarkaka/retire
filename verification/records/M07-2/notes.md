# M07.2 — Implement feasible sales with citizen treatment and hold restriction

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Feasible closing cash/contributions, holding restriction, sale failure, owner withholding and FIRPTA settlements pass. Section 1231 loss history and lookback ordering are removed.

## Implementation

- [src/model/property.ts](../../../src/model/property.ts)
- [src/model/engine.ts](../../../src/model/engine.ts)
- [src/model/settlements.ts](../../../src/model/settlements.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)

Case results: FIRPTA-1: RETIRED; FIRPTA-SHARE: RETIRED; SALE-FAIL: RETIRED; HOLD-1: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
