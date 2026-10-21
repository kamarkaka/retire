# M02.3 — Finish local upload/download and round-trip equivalence

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Local File.text/Blob downloads preserve UTF-8, immutable exports and reload equivalence. Current files carry no holding declarations; legacy uploads are rejected and the existing draft is preserved. No browser storage or configuration request.

## Implementation

- [src/App.tsx](../../../src/App.tsx)
- [src/config/downloads.ts](../../../src/config/downloads.ts)

## Automated evidence

- [e2e/chromium-sample-reimport.json](../e2e/chromium-sample-reimport.json)
- [e2e/chromium-edited-draft.toml](../e2e/chromium-edited-draft.toml)
- [e2e/chromium-simplified-accounts.json](../e2e/chromium-simplified-accounts.json)
- [browser-results.json](../browser-results.json)

Case results: CONFIG-ROUNDTRIP: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
