# M06.2 — Implement NRA and citizen income-tax profile routing

- Status: **PARTIAL** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Declared citizen/resident and noncitizen/nonresident income-tax routing pass. Resident-alien income-tax branch and broad primary-source acceptance remain OPEN. No estate-domicile/tax transition exists.

## Implementation

- [src/model/tax.ts](../../../src/model/tax.ts)
- [src/config/config.ts](../../../src/config/config.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)

Case results: NRA-1: PASS; EST-1: RETIRED; EST-2: RETIRED; EST-3: RETIRED; SOURCE-1: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
