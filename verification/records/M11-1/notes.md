# M11.1 — Reconcile household facts, PV controls and observed compound returns

- Status: **PARTIAL** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Gross household facts and missing-field gates are preserved. PV/FX/medical controls and observed 40/60 compound calibration pass; the verified after-tax household forecast still needs facts and tax support.

## Implementation

- [src/config/constructors.ts](../../../src/config/constructors.ts)
- [src/reference/calibration.ts](../../../src/reference/calibration.ts)
- [src/model/engine.ts](../../../src/model/engine.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
