# M09.4 — Implement cancel, full-run failure and stale-message protection

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Five cancel/restarts release workers, delayed old replies cannot replace a new run, summarizing cancellation discards results, and a later invalid CPI path fails all 4,000 requested paths.

## Implementation

- [src/workers/pool.ts](../../../src/workers/pool.ts)
- [src/App.tsx](../../../src/App.tsx)

## Automated evidence

- [e2e/chromium-failure-and-cleanup.json](../e2e/chromium-failure-and-cleanup.json)
- [e2e/chromium-ui-and-analysis-cancel.json](../e2e/chromium-ui-and-analysis-cancel.json)

Case results: RUN-CANCEL: SUITE; RUN-FAIL: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
