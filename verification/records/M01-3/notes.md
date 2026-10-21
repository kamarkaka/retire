# M01.3 — Prove worker loading and transfer ownership early

- Status: **PARTIAL** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Native worker probe returns [1,2,3], sender detaches; production transfers, directory mount and offline fresh workers pass in Chromium. Safari remains OPEN.

## Implementation

- [src/workers/probe.ts](../../../src/workers/probe.ts)
- [src/workers/pool.ts](../../../src/workers/pool.ts)

## Automated evidence

- [e2e/chromium-dev-harness.json](../e2e/chromium-dev-harness.json)
- [e2e/chromium-scheduling.json](../e2e/chromium-scheduling.json)
- [e2e/chromium-static-hosting.json](../e2e/chromium-static-hosting.json)

Case results: WORKER-TRANSFER: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
