# M04.4 — Prove stable indexed streams and stochastic calibration

- Status: **PARTIAL** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Indexed full-horizon draws and spending-independent prefix/schedule stability pass. Observed population/compound calibration passes; broader empirical Monte Carlo distribution targets remain OPEN.

## Implementation

- [src/model/rng.ts](../../../src/model/rng.ts)
- [src/model/market.ts](../../../src/model/market.ts)
- [src/reference/calibration.ts](../../../src/reference/calibration.ts)

## Automated evidence

- [e2e/chromium-scheduling.json](../e2e/chromium-scheduling.json)
- [unit-results.json](../unit-results.json)

Case results: RNG-PREFIX: SUITE; MARKET-CALIBRATION: OPEN.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
