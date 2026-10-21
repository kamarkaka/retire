# M09.3 — Verify reproducibility, prefix stability and immutable replay

- Status: **PARTIAL** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

One/four workers with delayed out-of-order chunks match all 1,000 compact paths exactly; 2000-path prefix and full replay paths 0/17/999 match. Cross-browser goldens remain OPEN.

## Implementation

- [src/model/canonical.ts](../../../src/model/canonical.ts)
- [src/model/results.ts](../../../src/model/results.ts)
- [src/workers/pool.ts](../../../src/workers/pool.ts)

## Automated evidence

- [e2e/chromium-scheduling.json](../e2e/chromium-scheduling.json)
- [e2e/chromium-sample-reimport.json](../e2e/chromium-sample-reimport.json)

Case results: RUN-REPRO: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
