# M05.1 — Implement single-source budget spending and one-time costs

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Budget annual minus included health supplies ordinary spending. The single aggregate health base is counted once; every budget uses initial treatment and there is no budget mode. Recurring/flex rules are removed; one-time scopes remain.

## Implementation

- [src/model/consumption.ts](../../../src/model/consumption.ts)
- [src/model/preview.ts](../../../src/model/preview.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)

Case results: BUDGET-1: RETIRED; SPENDING-TIMING: RETIRED; FLEX-1: RETIRED.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
