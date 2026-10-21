# M03.1 — Import verified source rows using Node tooling

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Repeatable shared JS collector fetches all five fixed public sources. Frozen98 US years/39 China years/45 FX years and both income yields match independent stdlib raw readers; homepage live gateway applies validated source-backed inputs.

## Implementation

- [scripts/market-data-source.ts](../../../scripts/market-data-source.ts)
- [scripts/fetch-market-data.ts](../../../scripts/fetch-market-data.ts)
- [scripts/market-data-gateway.ts](../../../scripts/market-data-gateway.ts)
- [scripts/verify-data.ts](../../../scripts/verify-data.ts)
- [verification/reference/check-refresh-source.py](../../../verification/reference/check-refresh-source.py)

## Automated evidence

- [M03/data-report.json](../M03/data-report.json)
- [e2e/chromium-market-refresh-live.json](../e2e/chromium-market-refresh-live.json)

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
