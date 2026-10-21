# M06.3 — Implement China tax, eligible payments and vintage FTC

- Status: **PARTIAL** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Eligible substantiated retained payments, partial remittances, country limits and annual FTC accounting pass. Legal expiry/refund/FX policies remain OPEN and are labeled example assumptions.

## Implementation

- [src/model/tax.ts](../../../src/model/tax.ts)
- [src/model/settlements.ts](../../../src/model/settlements.ts)
- [src/model/engine.ts](../../../src/model/engine.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)

Case results: CN-1: RETIRED; CN-2: PASS; CN-PARTIAL: PASS; CN-WITHHOLDING: PASS; CN-EXPIRY: OPEN; CN-REFUND: OPEN; CN-RESIDENCE: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
