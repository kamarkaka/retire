# M08.2 — Verify access, FX and nonpositive-net-worth stopping

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Financial years stop at nonpositive net worth; positive property equity can sustain simulation after a liquidity shortfall. Early/final closing taxes/refunds are retained, and future expenses/returns/tax years do not execute.

## Implementation

- [src/model/engine.ts](../../../src/model/engine.ts)
- [tests/stopping.test.ts](../../../tests/stopping.test.ts)

## Automated evidence

- [unit-results.json](../unit-results.json)
- [e2e/chromium-net-asset-stop.json](../e2e/chromium-net-asset-stop.json)

Case results: CONTROL-FX: PASS; CONTROL-DEPLETION: RETIRED; CONTROL-HOLD: SUITE.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
