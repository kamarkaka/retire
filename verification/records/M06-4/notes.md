# M06.4 — Audit primary sources and report source status

- Status: **OPEN** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

The current 15-row registry keeps whole-rule acceptance unverified, with scoped 2025 IRS capital worksheet evidence recorded separately. The original 18-row M00 registry stays archived. No verification checkbox controls Run; the broad audit is OPEN.

## Implementation

- [src/reference/source-gates.json](../../../src/reference/source-gates.json)
- [verification/source-gates.json](../../../verification/source-gates.json)
- [src/config/config.ts](../../../src/config/config.ts)

## Automated evidence

- [M03/data-report.json](../M03/data-report.json)
- [browser-results.json](../browser-results.json)

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
