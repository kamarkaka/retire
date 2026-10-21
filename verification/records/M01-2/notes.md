# M01.2 — Add the development harness and structured case reports

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Real product case runner, structured inputs/actual/expected/trace reports and dev-only harness. Unknown/unimplemented source cases cannot pass; fixture payload excluded from production.

## Implementation

- [scripts/verify-case.ts](../../../scripts/verify-case.ts)
- [src/verification/Harness.tsx](../../../src/verification/Harness.tsx)
- [src/verification/cases.ts](../../../src/verification/cases.ts)

## Automated evidence

- [product-cases.json](../product-cases.json)
- [e2e/chromium-dev-harness.json](../e2e/chromium-dev-harness.json)
- [build-results.json](../build-results.json)

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
