# M10.4 — Complete config/run/ledger downloads and end-to-end round trip

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Current/run/baseline TOML, full-precision 58-column CSV and scientific manifests download locally; reload/re-upload reproduces scientific inputs and all aggregates.

## Implementation

- [src/config/downloads.ts](../../../src/config/downloads.ts)
- [src/App.tsx](../../../src/App.tsx)

## Automated evidence

- [e2e/chromium-sample-reimport.json](../e2e/chromium-sample-reimport.json)
- [e2e/chromium-sample-path17.csv](../e2e/chromium-sample-path17.csv)
- [browser-results.json](../browser-results.json)

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
