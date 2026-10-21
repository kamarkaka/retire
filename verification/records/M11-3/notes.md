# M11.3 — Measure production performance, memory and cancellation

- Status: **PARTIAL** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Six genuine T52 warm runs meet 10s/90s gates, retain37.42MB, measure full-browser RSS and reject an oversized100k/T71 run plus baseline without changing N. The ordinary sample is T70. Safari performance remains OPEN; allocation guard is not an OS memory cap.

## Implementation

- [src/workers/pool.ts](../../../src/workers/pool.ts)
- [tests/e2e/performance.spec.ts](../../../tests/e2e/performance.spec.ts)

## Automated evidence

- [e2e/chromium-performance.json](../e2e/chromium-performance.json)
- [e2e/chromium-ui-and-analysis-cancel.json](../e2e/chromium-ui-and-analysis-cancel.json)

Case results: PERFORMANCE: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
