# Changelog

All notable user-facing changes to the retire simulator. Each Docker
release (`kamarkaka4/retire:latest` + version tag) bumps `package.json` and
adds an entry here, newest first.

## Unreleased

Dead result fields removed, plus consistency fixes. No simulation or tax
results change; saved configs keep loading.

- Ledger CSV drops five columns that were always constant or duplicated:
  `alive_A`, `alive_B`, `spend_plan_cny` (same as `spend_cny`),
  `withdraw_cny` and `cny_cash_cny` (always zero). CSV now has 38 columns
  and run manifests report `retire-results-v2`.
- `proceeds_account` is retired: sale proceeds always went to
  non-retirement liquid assets. Older files that still carry it load with
  the key dropped, and new downloads omit it.
- Each run keeps about 28% less chart memory, so larger runs fit within
  the 512 MiB budget.
- Every non-US citizen, including a green-card holder, is taxed as a US
  nonresident alien (NRA) for now. Assumptions and field help now say so;
  an explicit resident status for a non-citizen still blocks Run.
- Run manifests report `retire-model-v6` and `retire-draws-v4` and drop
  the stale `cny_cash_policy` field.
- The Assumptions page drops its Cash CNY card, and net-worth text and the
  ledger CSV comment no longer mention CNY cash.
- The year-detail NRA tax table shows pension/annuity income in its own
  row; its base previously left pensions out.

## 0.6.0 — 2026-10-29

Consistent type and spacing, configuration forms matching guided setup,
and start-page polish (`linux/amd64`). No simulation, configuration, or
tax behavior changes; saved configs are unaffected.

### Consistent type and spacing

- Bundled Inter with `PingFang SC` and `Microsoft YaHei` fallbacks;
  Eyebrow, Caption, and Small unified at 11px, all form controls at
  16px, and the `--ink` accent token defined.
- Spacing consolidated onto a 4/8/12/16/20/24/32/40px scale with
  unified page gutters, folded 6px/10px values, and a 6/10/12px radius
  scale. Check fields keep a 44px minimum height.

### Configuration forms

- Builder forms now share the guided setup's styling and behavior:
  shared 44px field styling, embedded guide editors, the 650px
  breakpoint, and 24px field/group gaps, with fresh-blank defaults (US
  domicile, current-year start, max age 110, random seed, one person).
- Section navigation titles enlarged to 14px; duplicated simulation
  title removed; run bar stays visible while scrolling.
- Budget shocks and late-life care can no longer fold away and show
  greyed out when unchecked; account balances fill half a row on
  desktop; people are added with a `+` button, as in Power mode.

### Start page

- Hero eyebrow removed and hero copy reworded to lead with spending,
  health costs, taxes, inflation, and the market.
- The 50-year planning example link is removed from the example card.
- The three main buttons now share one baseline, their icons are
  larger (56px), and card contents are centered.

## 0.5.2 — 2026-10-29

Favicon and brand mark only (`linux/amd64`). No configuration,
simulation, or tax behavior changes; saved configs are unaffected.

- The Reflex favicon now uses the green theme color (`#1f6259`) instead
  of brand purple, and the same mark replaces the hand-drawn R in the
  header brand tile.

## 0.5.1 — 2026-10-29

Favicon only (`linux/amd64`). No configuration, simulation, or tax
behavior changes; saved configs are unaffected.

- The browser tab now shows the Reflex brand mark (Simple Icons, brand
  purple) as a hashed SVG favicon served from the app itself.

## 0.5.0 — 2026-10-28

Guided setup redesign with Easy/Power modes, plus market and simulation
defaults (`linux/amd64`). Saved configs keep loading, except property
configs using the retired sell-when-liquid-below strategy, which strict
parsing now rejects.

### Guided setup

- A mode choice opens guided setup: Easy mode asks six questions, Power
  mode walks nine steps covering every configuration, with the builder
  editors embedded, sensible defaults pre-filled, and a one-way choice.
  The start page stays put until setup finishes, exiting asks for
  confirmation, and Start simulation runs the simulation right away.
- The example card now follows the build card; guided setup starts
  from blank.

### Power-mode fine-tuning

- One-row fields at a shared 44px height, two columns on tablet/desktop
  and one column on mobile, with inputs filling their cells and help
  shown only on info-button hover, focus, or tap.
- Household step: add/remove a second person, birth year and US citizen
  on one row, pension always expanded, domicile defaulting to United
  States. Budget, medical, accounts, and simulation steps received
  matching wording, currency, and gating passes.
- Property and one-time-cost names are edited by clicking their list
  headers (Property N / One-time cost N); the separate name and currency
  fields are gone, and currency is a narrow symbol dropdown on the
  amount input.

### Markets and simulation defaults

- Blank drafts sample full history (1928–2025) and the era selector says
  so; the income-yield default for US stocks rounds to 0.01336; market
  advanced groups start open; the FX mode reads PPP.
- Each fresh Power setup draws a new random simulation seed instead of
  the fixed 42.
- Unchecking US citizen now means non-US citizen and no longer blocks
  setup with a missing value.

## 0.4.0 — 2026-10-26

New income, spending, and planning features (`linux/amd64`). Saved
configs keep loading; new options default to off.

### Pension and annuity income

- Each person can now receive a yearly pension or annuity from a start
  age, optionally rising with US inflation. Payments arrive as spendable
  cash, are taxed as ordinary US income, and are never taxed by China.
- The year-detail modal splits retirement-account distributions from
  pension/annuity income in the AGI breakdown.

### Flexible spending

- Optional guardrails on the non-medical budget: after an up year
  spending can rise to a configurable raise limit, after a down year it
  can fall to a cut limit, with a random multiplier each year that never
  over-spends bad years or under-spends good years.
- The yearly spending multiplier is shown in the year ledger; medical
  spending, shocks, care, and one-time costs never flex.

### What-would-it-take solvers

- New Results section answers two questions at 50/90/99/100% success:
  how much extra to add to non-retirement assets, and what annual
  spending budget to set with medical expenses unchanged.
- Answers rerun the same market paths, show progress with cancel, and
  degrade honestly when a target is out of reach.

## 0.3.1 — 2026-10-23

Small refinement (`linux/amd64`).

### Year ledger

- Two-person simulations now show total US income tax and total China
  income tax columns summing both members, instead of person A's bill
  only. One-person ledgers are unchanged; the detail modal and CSV
  export keep per-person breakdowns.

## 0.3.0 — 2026-10-23

Configuration simplification pass (`linux/amd64`). Saved configs keep
loading; hidden values are derived automatically.

### Simpler configuration

- US income-tax status is now derived from citizenship and property
  ownership from household size — both inputs removed from the UI, along
  with the retired sex field and the Schema tab.
- Advanced market, inflation, FX, and medical-shock options now render
  collapsed; rarely touched knobs (China inflation internals,
  liquidation-sale triggers, proceeds account) moved to advanced.
- Removed the page footer.

### Other

- Header version badge reads the release version automatically, so it
  always matches the Docker tag.

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
