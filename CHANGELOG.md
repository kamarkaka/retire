# Changelog

All notable user-facing changes to the retire simulator. Each Docker
release (`kamarkaka4/retire:latest` + version tag) bumps `package.json` and
adds an entry here, newest first.

## Unreleased

(nothing yet)

## 0.1.0 — 2026-10-22

First Docker release (`linux/amd64`). Local Monte Carlo retirement
simulator, English + Chinese UI with real-time switching.

### Simulation model

- Fixed three accounts in strict withdraw order: non-retirement liquid
  assets (brokerage), after-tax retirement savings, pre-tax retirement
  savings. Ownership is derived: 50/50 with two people, full A with one.
- Annual surplus always lands in the brokerage account.
- US income tax per person (resident vs nonresident rules, standard
  deduction, preferential gains rates, NIIT, early-withdrawal penalty)
  plus China income tax for China-domicile households with a US tax credit.
- Required minimum distributions, Rule of 55 exemption, property holdings
  with last-resort sale in tab order, medical shocks and late-life care,
  one-time costs, CNY/USD exchange rate with conversion quota.
- Social Security is excluded from the model entirely.

### Year ledger

- Curated domicile-aware columns: USD-only net worth, Medical USD for US
  domicile, second-person and China columns hidden when inapplicable.
- Worst / P10 / Median representative-path switcher with sliding selection.
- Row click opens a detail modal: per-asset Base × Return = Gain with
  taxable-now vs tax-deferred split and a dividends row, per-resident AGI
  breakdown, per-person US and China tax base/rate tables, and an
  ending-net-worth derivation walk tied to the ledger cells.
- Full-precision CSV and path-provenance JSON downloads for any path.

### App

- Landing page with example configs, file upload, and a question-based
  guided setup (including simplified shock/care questions) that runs the
  simulation on completion.
- Results with wealth percentiles and success metrics, Assumptions,
  Compare with pinned baselines, and a Year ledger tab.
- Server-managed market data: monthly refresh on the host, pinned per run;
  users never fetch or upload market data.

### Verification

- 131 unit tests, 35/35 browser E2E, and passing M00 numeric oracle cases.
