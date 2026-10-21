# M11.2 — Replay dot-com/2008 annual losses and sequence effects

- Status: **PASS** for the scope below.
- Recorded: 2026-10-20T11:36:03.928Z
- Build: 0.1.0+c8db356364cb09f858f3b1a01c2840f5466826d2a158b0b441f6c0820f05a027
- Human/manual sign-off: RETIRED.

## Scope and result

Actual year loop reproduces the frozen two-year sequence and loss carryovers. Observed 2000–2002, 2008 and 2022 calendar tapes reproduce independent 40/60 Treasury balances, with and without beginning-year withdrawals.

## Implementation

- [src/model/engine.ts](../../../src/model/engine.ts)
- [src/model/tax.ts](../../../src/model/tax.ts)
- [src/verification/cases.ts](../../../src/verification/cases.ts)
- [tests/historical-data.test.ts](../../../tests/historical-data.test.ts)

## Automated evidence

- [M11/historical-dotcom.json](../M11/historical-dotcom.json)
- [M11/historical-gfc.json](../M11/historical-gfc.json)
- [M11/historical-stocks_and_bonds_down.json](../M11/historical-stocks_and_bonds_down.json)
- [product-cases.json](../product-cases.json)

Case results: SEQUENCE-1: PASS; CRISIS-DOTCOM: OPEN; CRISIS-2008: OPEN.

Numeric reports retain raw inputs, independent expected answers, actuals, intermediates, tolerance and source IDs. RETIRED preserves superseded original oracles; excluded subfields are explicit. SUITE refers to separate structural/browser checks; OPEN is not PASS. Scoped IRS evidence is checked; broader rules and actual household readiness remain separate.
