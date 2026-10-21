# M02.1 — Implement strict TOML parsing, normalization and draft gates

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Strict staged TOML import, normalized defaults and runnable gates. Legacy and versionless uploads are rejected with no migration path.

## Implementation

- [src/config/schema.ts](../../../src/config/schema.ts)
- [src/config/config.ts](../../../src/config/config.ts)
- [tests/accounts.test.ts](../../../tests/accounts.test.ts)

## Automated evidence

- [unit-results.json](../unit-results.json)
- [browser-results.json](../browser-results.json)
- [e2e/chromium-simplified-accounts.json](../e2e/chromium-simplified-accounts.json)

Case results: CONFIG-INVALID: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
