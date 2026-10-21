# M05.2 — Implement aggregate medical growth, shocks and continuing additional care

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Medical price/age growth, two-person shocks and care from selected start age through final horizon pass. Care is always additional; no care end age/scope or per-person base exists. These tests do not calibrate clinical risk.

## Implementation

- [src/model/consumption.ts](../../../src/model/consumption.ts)
- [src/model/rng.ts](../../../src/model/rng.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)

Case results: MORT-1: RETIRED; MEDICAL-GROWTH: PASS; MEDICAL-SCOPE: PASS.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
