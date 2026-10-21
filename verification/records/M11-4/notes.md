# M11.4 — Verify static hosting, local files and offline computation

- Status: **PARTIAL** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Chromium covers static directory mounts, explicit public-data GET refresh, package import/export, failure/cancel preservation and offline fresh run/replay without config requests or storage. The public gateway has no user configuration input. Safari remains OPEN.

## Implementation

- [scripts/market-data-gateway.ts](../../../scripts/market-data-gateway.ts)
- [tests/e2e/market-data.spec.ts](../../../tests/e2e/market-data.spec.ts)
- [src/config/downloads.ts](../../../src/config/downloads.ts)

## Automated evidence

- [e2e/chromium-market-refresh-live.json](../e2e/chromium-market-refresh-live.json)
- [e2e/chromium-market-refresh-errors.json](../e2e/chromium-market-refresh-errors.json)
- [e2e/chromium-static-hosting.json](../e2e/chromium-static-hosting.json)
- [e2e/chromium-offline-manifest.json](../e2e/chromium-offline-manifest.json)
- [browser-results.json](../browser-results.json)

Case results: PRIVACY-OFFLINE: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
