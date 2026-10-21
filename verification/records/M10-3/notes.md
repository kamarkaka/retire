# M10.3 — Add full-precision ledger/provenance and immutable comparison

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Full-precision replay uses completed-run references, not refreshed global data. Integer ledger money and58-column CSV show only simulated years and stop metadata; original/pinned ledgers are byte-identical after refresh; data+TOML reproduce a run after reload.

## Implementation

- [src/components/Ledger.tsx](../../../src/components/Ledger.tsx)
- [src/workers/pool.ts](../../../src/workers/pool.ts)
- [src/config/downloads.ts](../../../src/config/downloads.ts)

## Automated evidence

- [browser-results.json](../browser-results.json)
- [e2e/chromium-market-refresh-snapshots.json](../e2e/chromium-market-refresh-snapshots.json)
- [e2e/chromium-net-asset-stop.json](../e2e/chromium-net-asset-stop.json)

Case results: RUN-IMMUTABLE: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
