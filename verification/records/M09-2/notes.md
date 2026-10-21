# M09.2 — Implement quantiles, fixed cohorts, rankings and scalar KPIs

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Type7 quantiles, whole-N fixed-lifetime cohorts, separate funding/ending-income-tax/budget metrics, stable ranking and Float64 scalar summaries pass. Legacy estate/flex/death output slots have compatibility meanings only.

## Implementation

- [src/model/results.ts](../../../src/model/results.ts)
- [src/model/layout.ts](../../../src/model/layout.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)

Case results: SUMMARY-1: RETIRED; RANKING-1: PASS.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
