# M06.1 — Implement resident capital netting and income tax

- Status: **PARTIAL** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Supported resident tax/netting, annual loss deduction/carry and early penalty pass. Partial positive all-long-term Section1250 ordering uses checked 2025 IRS worksheets and independent carryover cases; the broader audit remains OPEN.

## Implementation

- [src/model/tax.ts](../../../src/model/tax.ts)
- [verification/sources/irs-schedule-d-2025.md](../../../verification/sources/irs-schedule-d-2025.md)
- [verification/sources/irs-schedule-d-2025.json](../../../verification/sources/irs-schedule-d-2025.json)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [unit-results.json](../unit-results.json)
- [e2e/chromium-section1250-regression.json](../e2e/chromium-section1250-regression.json)

Case results: US-1: PASS; US-2: PASS; US-3: PASS; US-4: PASS; US-5: PASS; US-6: PASS; US-7: PASS; US-8: PASS; US-CARRY: PASS; US-EARLY: PASS; CAPITAL-PARTIAL: OPEN; PROPERTY-1231: RETIRED.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
