# Changelog

All notable user-facing changes to the retire simulator. Each Docker
release (`kamarkaka4/retire:latest` + version tag) bumps `package.json` and
adds an entry here, newest first.

## Unreleased

(nothing yet)

## 0.2.0 — 2026-10-22

Market customization plus a higher-fidelity default run (`linux/amd64`).

### Markets

- New History era presets: pick a sampling window — full history
  1928–2025, postwar 1946–2025, modern 1980–2025, high-inflation
  1966–1982, or crisis periods (Great Depression 1929–1939, dot-com/GFC
  2000–2009) — instead of always sampling the full history.
- New Outlook shift knob: a single annual-return adjustment applied to
  stocks and bonds for optimistic/pessimistic scenarios; cash and
  inflation are untouched.
- Removed the low-value Sample defaults and Stable prices buttons under
  Markets, inflation & FX.

### Simulation

- Default simulation paths raised from 200 to 5000 for tighter result
  distributions; the shipped sample config uses 5000 as well.

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
