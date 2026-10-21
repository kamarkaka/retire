# M03.2 — Calculate population moments and freeze reference versions

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Observed US population statistics and China/FX calibration agree with independent arithmetic. Source stock dividend fraction and latest Treasury par-yield proxy are checked without adding yield to total return.

## Implementation

- [src/reference/calibration.ts](../../../src/reference/calibration.ts)
- [src/reference/fred.ts](../../../src/reference/fred.ts)
- [tests/market-data.test.ts](../../../tests/market-data.test.ts)

## Automated evidence

- [M03/data-report.json](../M03/data-report.json)
- [unit-results.json](../unit-results.json)

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
