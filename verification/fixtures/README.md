# Frozen independent oracle catalog and current fixture scope

The original80-case [oracles.json](oracles.json) and [tax-table snapshot](tax-tables.spec.json) remain unchanged. Their original NOT IMPLEMENTED/manual metadata describes M00 preparation time; current app execution is in [product cases](../records/product-cases.json), [unit results](../records/unit-results.json) and [browser results](../records/browser-results.json). Human execution/sign-offs are retired.

Independent reference arithmetic still recomputes all55 original numeric answers. Current product comparison passes33, explicitly retires23 obsolete cases, reports6 broader cases OPEN and labels18 structural cases SUITE. Replacement fixed-horizon/budget/medical/care/SS/zero-CNY-interest/decimal requirements use separate current unit/browser assertions. MARKET-TIMING keeps its FX/CPI/medical oracle and explicitly excludes only the removed deposit-rate subfield.

## Original case IDs, current applicability

| Case | Original step | Original oracle | Current comparison scope |
|---|---|---|---|
| US-1 | M06.1 | numeric | Applicable independent numeric |
| US-2 | M06.1 | numeric | Applicable independent numeric |
| US-3 | M06.1 | numeric | Applicable independent numeric |
| US-4 | M06.1 | numeric | Applicable independent numeric |
| US-5 | M06.1 | numeric | Applicable independent numeric |
| US-6 | M06.1 | numeric | Applicable independent numeric |
| NRA-1 | M06.2 | numeric | Applicable independent numeric |
| CN-1 | M06.3 | numeric | Applicable independent numeric |
| EST-1 | M06.2 | numeric | RETIRED |
| EST-2 | M06.2 | numeric | RETIRED |
| EST-3 | M06.2 | numeric | RETIRED |
| RMD-1 | M05.4 | numeric | Applicable independent numeric |
| MORT-1 | M05.2 | numeric | RETIRED |
| US-7 | M06.1 | numeric | Applicable independent numeric |
| US-8 | M06.1 | numeric | Applicable independent numeric |
| FIRPTA-1 | M07.2 | numeric | Applicable independent numeric |
| DEATH-1 | M07.3 | numeric | RETIRED |
| DEATH-2 | M07.3 | numeric | RETIRED |
| TERMINAL-1 | M07.3 | numeric | Applicable independent numeric |
| CN-2 | M06.3 | numeric | Applicable independent numeric |
| US-CARRY | M06.1 | numeric | Applicable independent numeric |
| US-EARLY | M06.1 | numeric | Applicable independent numeric |
| CAPITAL-PARTIAL | M06.1 | conditional | OPEN: broader source/data |
| PROPERTY-1231 | M06.1 | conditional | OPEN: broader source/data |
| CN-PARTIAL | M06.3 | numeric | Applicable independent numeric |
| CN-WITHHOLDING | M06.3 | numeric | Applicable independent numeric |
| CN-EXPIRY | M06.3 | conditional | OPEN: broader source/data |
| CN-REFUND | M06.3 | conditional | OPEN: broader source/data |
| CN-RESIDENCE | M06.3 | structural | SUITE: separate structural/browser tests |
| RNG-VECTORS | M04.1 | numeric | Applicable independent numeric |
| RNG-PREFIX | M04.4 | structural | SUITE: separate structural/browser tests |
| MARKET-JOINT | M04.2 | numeric | Applicable independent numeric |
| MARKET-PROJECTION | M04.2 | numeric | Applicable independent numeric |
| MARKET-DOMAIN | M04.2 | structural | SUITE: separate structural/browser tests |
| MARKET-TIMING | M04.3 | numeric | Applicable independent numeric; original deposit_rate subfield excluded |
| MARKET-AR | M04.3 | numeric | Applicable independent numeric |
| MARKET-INVALID | M04.3 | numeric | Applicable independent numeric |
| MARKET-CALIBRATION | M04.4 | conditional | OPEN: broader source/data |
| BUDGET-1 | M05.1 | numeric | RETIRED |
| SPENDING-TIMING | M05.1 | numeric | RETIRED |
| FLEX-1 | M05.1 | numeric | RETIRED |
| MEDICAL-GROWTH | M05.2 | numeric | Applicable independent numeric |
| MEDICAL-SCOPE | M05.2 | numeric | Applicable independent numeric |
| SS-GATES | M05.3 | numeric | RETIRED |
| ACCOUNT-BASIS | M05.4 | numeric | Applicable independent numeric |
| ACCOUNT-REBALANCE | M05.4 | numeric | Applicable independent numeric |
| ACCOUNT-ACCESS | M05.4 | structural | SUITE: separate structural/browser tests |
| CONVERSION-1 | M05.4 | numeric | Applicable independent numeric |
| SOURCE-1 | M06.2 | structural | SUITE: separate structural/browser tests |
| PROPERTY-BOOKS | M07.1 | numeric | Applicable independent numeric |
| PROPERTY-MORTGAGE | M07.1 | numeric | Applicable independent numeric |
| FIRPTA-SHARE | M07.2 | numeric | Applicable independent numeric |
| SALE-FAIL | M07.2 | numeric | Applicable independent numeric |
| HOLD-1 | M07.2 | structural | SUITE: separate structural/browser tests |
| DEATH-SNAPSHOT | M07.3 | numeric | RETIRED |
| TERMINAL-REFUND | M07.3 | numeric | Applicable independent numeric |
| TERMINAL-DEFICIT | M07.3 | numeric | Applicable independent numeric |
| CONTROL-PV | M08.1 | numeric | Applicable independent numeric |
| CONTROL-FX | M08.2 | numeric | Applicable independent numeric |
| CONTROL-DEPLETION | M08.2 | numeric | Applicable independent numeric |
| CONTROL-HOLD | M08.2 | structural | SUITE: separate structural/browser tests |
| ENGINE-FINAL-TAX | M08.3 | numeric | RETIRED |
| ENGINE-PRIOR-TAX | M08.3 | numeric | RETIRED |
| ENGINE-FIRPTA | M08.3 | numeric | Applicable independent numeric |
| SUMMARY-1 | M09.2 | numeric | RETIRED |
| RANKING-1 | M09.2 | numeric | Applicable independent numeric |
| SEQUENCE-1 | M11.2 | numeric | Applicable independent numeric |
| CRISIS-DOTCOM | M11.2 | conditional | OPEN: broader source/data |
| CRISIS-2008 | M11.2 | conditional | OPEN: broader source/data |
| CONFIG-ROUNDTRIP | M02.3 | structural | SUITE: separate structural/browser tests |
| CONFIG-INVALID | M02.1 | structural | SUITE: separate structural/browser tests |
| DRAFT-GATES | M02.2 | structural | SUITE: separate structural/browser tests |
| WORKER-TRANSFER | M01.3 | structural | SUITE: separate structural/browser tests |
| RUN-REPRO | M09.3 | structural | SUITE: separate structural/browser tests |
| RUN-CANCEL | M09.4 | structural | SUITE: separate structural/browser tests |
| RUN-FAIL | M09.4 | structural | SUITE: separate structural/browser tests |
| RUN-IMMUTABLE | M10.3 | structural | SUITE: separate structural/browser tests |
| PERFORMANCE | M11.3 | structural | SUITE: separate structural/browser tests |
| PRIVACY-OFFLINE | M11.4 | structural | SUITE: separate structural/browser tests |
| HOUSEHOLD-GATE | M11.5 | structural | SUITE: separate structural/browser tests |

## Files and independent controls

- control-pv.toml / control-fx.toml: start2026, both40, Max89 and50 beginning-year payments. Literal PVs2,390,572.9770677146 /3,152,520.3411145047 are not generated by product code. NRA owners hold brokerage cash, exempt under bundled tables, so zero-tax arithmetic is preserved with no overrides.
- engine-final-tax.toml / engine-prior-tax.toml / engine-firpta.toml: real pending-income-tax/refund controls ending at475266 /474402.6 /232417.5 after-tax assets under bundled reference rates. Legacy oracle heirs/estate names are compatibility labels; there is no death event.
- control-depletion.toml: accessible120k Roth,12k annualUSD need and first real shortfall at t10.
- spec-example.toml: current exported sample, matching examples/sample.toml; both1986/F-M/China domiciled, continuing additional care and no CNY interest. Social Security is not modeled.
- ../archive/pre-fixed-horizon/: original pre-change engine inputs retained for provenance; literal oracles/old source status were not rewritten.
- ../sources/irs-schedule-d-2025.*: original IRS PDF, exact worksheet text/hash/retrieval metadata and separately authored long-term §1250 cases.

`npm run verify -- --all` records actual values/intermediates against frozen literal answers. The independent reference calculator never imports product code. RETIRED/OPEN/SUITE is not PASS; broad source/history/actual-household readiness remains separate.
