# M00.2 — Prepare independently calculated fixture oracles

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

All55 frozen arithmetic answers remain unchanged;33 product cases pass,6 broad cases stay OPEN and23 superseded cases are RETIRED. MARKET-TIMING excludes removed deposit-rate/FX-event subfields. PV controls use explicit test-only reference rows.

## Implementation

- [verification/market-tapes.ts](../../../verification/market-tapes.ts)
- [verification/fixtures/oracles.json](../../../verification/fixtures/oracles.json)
- [verification/reference/recalculate.mjs](../../../verification/reference/recalculate.mjs)

## Automated evidence

- [reference-arithmetic.json](../reference-arithmetic.json)
- [product-cases.json](../product-cases.json)

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
