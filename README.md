# Retire — local retirement simulator

React, TypeScript, Vite and ECharts. The engine, workers and result analysis run in the browser. Upload TOML or build/edit a configuration in the app, then download it to save. There is no configuration API or simulation service.

## Start the app

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/`. Choose **Load sample config**, then **Run simulation**. The sample runs 200 paths, starts in 2027 with A/B born 1986, and has a maximum 70-year horizon. It stops earlier if net assets reach zero or below. A is Female/US citizen; B is Male/non-US citizen; the household domicile is China. Sex is descriptive; everyone remains alive throughout.

You can upload [examples/sample.toml](examples/sample.toml). [examples/control-50year.toml](examples/control-50year.toml) is a 50-year planning example, ages 40–89 with Max age 89; it uses the same historical returns as all other configs. Independent constant-return PV controls use test-only literal data. The app never fetches these example files. **Download current config** saves draft edits; **Download run config** saves the immutable completed inputs. Reload clears session state; re-upload a saved file to continue.

## Languages

The header switcher toggles English and 简体中文 instantly; the choice persists across reloads and the browser default applies on first visit. Charts, numbers, field labels, help text and market messages all follow the switch. Validator diagnostics stay in English with their config paths. To add a language, author one file shaped like `src/i18n/zh.ts` (every `MessageKey` plus field/label/enum/unit tables) and register it in `src/i18n/core.ts`; `tests/i18n.test.ts` fails until the new locale is complete.

## Refresh market data

Click **Refresh market data** on the homepage to download all five public sources: NYU annual returns/dividends and FRED US CPI, China CPI, USD/CNY and 10-year Treasury yield. Refresh replaces the active historical/calibration references, the two income yields and spot FX. It preserves budgets, allocations and configured China/FX risk parameters. Source dates/definitions/hashes are shown; failed/canceled refreshes preserve your work.

The sourced example yields are **1.335854% stock income** (2025 dividends 78.57 ÷ opening index 5881.63) and **5.10% bond income** (FRED DGS10, 2026-10-15). The former 1.3%/4.2% were undated assumptions. DGS10 is a par-Treasury income proxy, which can differ from actual portfolio coupons. Neither yield adds extra total return.

`npm run dev` and `npm run preview` include a read-only public-data gateway because the providers lack browser CORS headers. It requires Node and `curl`, accepts no financial inputs, and stores no configs. Repeat the identical collector outside the app with:

```sh
npm run data:fetch -- --output data/refreshed
```

Upload its `market-data.json` with **Upload market data**. Static hosts support this file workflow without a gateway. For reproducibility, download **run market data** and **run config** from a completed result; after reload, upload the data package before the TOML. Refresh never changes a completed or pinned run's ledger.

## Configuration and calculations

- **Accounts carry no income settings.** Income treatment is fixed by asset: stocks pay qualified dividends, bonds pay coupon interest with zero-gain sales, and cash earns money-market interest. Cash USD accounts earn a configured rate or the T-bill return instead of holding assets. Older files with retired holding declarations are rejected on import; downloads never contain them.
- **Every configuration input has plain-English help.** Hover a field or its info button, focus it with the keyboard, or tap the info button to read the explanation. Escape closes it. Help includes list cells, seed controls and the TOML editor. Mouse-wheel gestures cannot change a focused numeric input; decimal typing and keyboard editing still work.
- Simulation contains start year, path count, seed and Max age. Households have one or two people with one domicile country. Everyone remains alive. Financial paths stop at the younger person's Max age year (or that person's, in a one-person household) or earlier when net worth becomes nonpositive; the older can exceed it. Gompertz/death/survivor/estate transitions are removed.
- All configurations use the same calculation/validation rules. Removed Simulation kind/assumptions/unresolved_inputs/legal_rules_verified/verification_note fields cannot change Run; files carrying that legacy metadata are rejected on import.
- The Random button chooses an integer from 0 through 4,294,967,295 for the simulation seed; completed/active runs retain their original inputs.
- Annual budget (includes medical) minus Medical expenses supplies ordinary spending. Medical expenses is the **single aggregate medical base for the household**. There is no recurring-spending list/flex rule or People medical-base field.
- Medical adds per-person shocks and continuing late-life care, configured in the Medical group of the Budget section. Configure enabled/start age/monthly CNY/real growth. Care is **always additional**, begins at the chosen age for the earliest-born person and continues through the final year. It has no end age or budget scope; Medical/total/funding include it, and it stays outside included consumption. Every budget uses initial treatment; there is no budget mode.
- Social Security is **excluded from the entire simulation**: no benefits are ever paid and there are no Social Security inputs, so results never include Social Security income.
- Markets, inflation & FX has **Markets / Inflation / FX** groups. Numeric inputs preserve decimal text such as 0.003. Stock/bond yields are income portions of total returns used for taxable-account income/basis accounting. Custom means/volatilities and FX stress events are removed; old files carrying those fields are rejected on import.
- **Path stopping:** net worth includes USD accounts, Cash CNY and property equity after mortgages, using that boundary's FX. Stop before any cash flows if it starts nonpositive, or at the first nonpositive year end. Taxes are computed and paid each simulated year; any leftover unpaid tax is deducted once at the stop. Ledger/CSV contain only simulated years; later wealth percentiles include stopped paths as zero. Positive property equity can keep a path running after liquid funds are exhausted.
- **Cash CNY interest is deliberately omitted** and may be added back in the future. Its former real-rate/floor fields are removed. Deposits/withdrawals change nominal balance; FX and inflation still affect value. The Markets note and model-v5.1 manifest record this policy.

Valid files are normalized into current inputs without mutating the upload. Unknown fields, invalid types/nonfinite values, missing required facts and unsupported tax combinations remain errors. Actual input/combination checks control Run; broad source status is reported separately.

## Year ledger

The default table shows starting liquid USD, starting nominal net worth CNY, spending excluding medical, full Medical and annual financial investment return. Opening balances precede all current-year flows. Medical includes the single Budget base, each member's shocks and continuing care; other spending includes one-time costs.

Financial return is balance-weighted across USD financial assets and zero-interest Cash CNY after opening-year flows, valued at opening FX, before personal tax/FX changes; property is excluded. No invested capital produces a missing return.

**Ledger money displays as integers.** FX/indices retain decimals and returns use percentages. Engine decisions, scalar KPIs, provenance and all 42 CSV columns retain full Float64 precision.

## Automated verification

```sh
npx playwright install chromium
npm run check
```

The gate runs independent reference arithmetic, type checking, unit/integration tests, data/numeric checks, a production build, all browser workflows, inventory and release records. No manual sign-off is required. All 42 original M00–M11 steps remain indexed in [implementation status](verification/implementation-status.md).

Some individual checks:

```sh
npm test
npm run verify -- --all
npm run data:verify
npm run build
npm run test:e2e
```

The development-only harness is at `/verification` on the dev server and is excluded from production. Node 24.22.0 is pinned in the lockfile and `.node-version`; npm scripts use the installed local Node binary. Run manifests include build/configuration/reference hashes and the fixed-lifetime/zero-CNY-interest policies.

## Current evidence scope

- Bundled US market rows are **observed NYU/FRED history for 1928–2025**, version `nyu-fred-1928-2025-v1`. Stocks, 10-year Treasuries, T-bills and home prices come from the NYU workbook; US CPI uses FRED December-to-December changes. All 490 annual series values are independently checked. China CPI (1987–2025) and year-end USD/CNY (1981–2025) supply observed calibration references; future China/FX paths use configured parameters. [Sources, conventions and reproduction](data/README.md).
- All configurations use unchanged historical return rows, **not a 3% planning target**. Historical stocks compounded at about 10.02% before tax; an annually rebalanced 40% stock / 60% 10-year Treasury reference compounded at about 7.24%. The sample also uses 1.7% mean China inflation; it does not implement the earlier 3%-return/4%-inflation stress case. Calendar dot-com/2008/2022 engine replays are checked separately from the bootstrap forecasts.
- Tax modeling stays simple on purpose: all-long-term netting with loss carryforward, property gains at LTCG rates, no state tax, no Social Security, and same-year payment with a same-year China credit. The §1250 25% bucket is intentionally not modeled and its former scoped evidence is archived. Broad legal acceptance remains OPEN. Section 1231 loss history and lookback ordering are removed.
- The actual household draft preserves 5.3M gross financial assets, 2M property / 731k loans, FX 6.69 and 250k CNY with 38k included medical. Missing account bases/property inputs and B's retained-green-card resident-alien income-tax branch still prevent a household forecast; sample B uses an explicit NRA assumption.
- Original 55 M00 arithmetic answers remain unchanged. The current product runner passes 18 cases, explicitly retires 38 superseded cases and excludes the old deposit-rate and FX-stress subfields from MARKET-TIMING. Six broad cases are OPEN and 18 structural cases are labeled SUITE; replacement requirements have unit/browser evidence.
- Chromium uses a single-process workaround on this macOS host. Ordinary child-process/WebKit launch fails before app load; Safari acceptance remains OPEN. On a suitable host use `RETIRE_MULTI_PROCESS=1 npm run test:e2e`; add `RETIRE_TEST_WEBKIT=1` after installing WebKit.

The explicit 20,000-path/T52 benchmark retains 32,300,000 bytes; ordinary sample T70 is separate. The 512 MiB preflight budgets modeled allocations plus reserve, not OS browser memory. [Performance evidence](verification/records/e2e/chromium-performance.json) records six runs, measured RSS and oversized-run rejection without changing N.

## Static build

Serve `dist/` on a static host. Relative asset URLs support directory mounts; `RETIRE_BASE_PATH=/retire/ npm run build` sets an explicit base. Loaded assets include workers, so fresh runs/replay/upload/download work offline; a cold offline page load is unsupported.

Configurations are never read from the host or automatically saved to browser storage. The public-data gateway is available in dev/preview and `scripts/serve-test-build.ts`; standalone static deployment uses uploaded market packages unless it separately hosts that read-only gateway.
