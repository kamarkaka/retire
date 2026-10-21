# M09.1 — Execute bounded path chunks and aggregate off the main thread

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Bounded four-worker/64-path chunks, indexed assembly, transfers and off-main-thread aggregation pass actual production workers.

## Implementation

- [src/workers/pool.ts](../../../src/workers/pool.ts)
- [src/workers/simulate.worker.ts](../../../src/workers/simulate.worker.ts)
- [src/workers/analysis.worker.ts](../../../src/workers/analysis.worker.ts)

## Automated evidence

- [e2e/chromium-scheduling.json](../e2e/chromium-scheduling.json)
- [e2e/chromium-ui-and-analysis-cancel.json](../e2e/chromium-ui-and-analysis-cancel.json)

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
