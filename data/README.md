# Historical reference data

The app bundles **observed NYU/FRED history**, version `nyu-fred-1928-2025-v1`. Public data are compiled into app assets; simulations do not fetch source files or use server configuration files.

| Bundled file | Source and convention | Coverage |
|---|---|---|
| [US history](../src/reference/history.json) | NYU nominal stock total return, 10-year Treasury total return, T-bill rate proxy, home-price change; FRED December-to-December US CPI | 1928–2025, 98 joint years |
| [China CPI](../src/reference/cn-cpi.json) | FRED/World Bank annual-average percentage divided by 100 | 1987–2025; calibration 1997–2025 |
| [Year-end USD/CNY](../src/reference/usdcny.json) | FRED last valid daily CNY-per-USD observation in each year | 1981–2025; log-return calibration 2006–2025 |
| [Market data package](../src/reference/market-data.json) | Full portable reference snapshot, sourced income yields, latest observations and raw public-source hashes | Frozen shipped source dates plus explicit refresh |
| [Provenance](../src/reference/provenance.json) | Source URLs, retrieval times, raw/derived hashes and independent-reader receipts | All active references |

Sources: [NYU workbook and mapping](../verification/sources/nyu-historical-returns-1928-2025/README.md), [FRED CSVs and conventions](../verification/sources/fred/README.md). The workbook inflation column is replaced with FRED `CPIAUCNS` December-to-December CPI, including 2025. Home returns exclude rent. The bond proxy is 10-year US Treasuries, not a broad bond fund.

## What drives the simulation

US rows are jointly resampled with the configured stationary bootstrap/window. All configurations use unchanged historical rows; Custom rescaling and FX stress events are removed. China inflation and FX use the configured AR(1)/FX models; their historical files supply observed calibration references, displayed under Assumptions.

Historical returns do **not** impose a 3% conservative planning return. Over this window, stocks compounded at 10.02% and an annually rebalanced 40% stock / 60% 10-year Treasury portfolio at 7.24%, before personal taxes or spending. The sample uses 1.7% mean China inflation. Fixed3%/4% arithmetic is tested with literal development-only reference rows, not a configurable rescaling mode.

## Income yield sources

The original stock0.013/bond0.042 assumptions were fixed examples without dated sources. The sourced replacement is:

| Input | Source/definition | Shipped value |
|---|---|---|
| Stock income | NYU2025 S&P dividends / beginning-year index level,78.57 /5881.63 | 0.01335854176478289 |
| Bond income | Latest FRED DGS10 ten-year constant-maturity Treasury **par yield**,2026-10-15,5.10% | 0.051 |

DGS10 is a par-Treasury income proxy, not an existing portfolio's coupon income or guaranteed total return. These fixed scenario rates split sampled stock/bond total return into taxable income/reinvested basis and price change. They are never added to total growth; you can edit them for your holdings. Treasury-bill return is entirely income. CNY cash earns no interest.

## Repeatable public refresh and integration

A scheduled server job downloads the NYU workbook and all four FRED CSVs (`CPIAUCNS`, `FPCPITOTLZGCHN`, `DEXCHUS`, `DGS10`); users never trigger a fetch. Shared JS collector: [market-data-source.ts](../scripts/market-data-source.ts). Job: [market-data-refresh.ts](../scripts/market-data-refresh.ts). Production/test hosts expose a parameter-free, body-free `GET api/market-data` served from the job-maintained package; the gateway has no scenario files, configuration input or persistence. Both providers currently lack browser CORS headers. The app remains usable with a static host/offline assets using the bundled data.

Run the same collector explicitly:

```sh
npm run data:fetch -- --output data/refreshed
python3 verification/reference/check-refresh-source.py --source-dir data/refreshed
```

The first command writes public raw files and `market-data.json` after every source is fetched and all checks pass. The second independently reconciles every annual value and both income yields, using stdlib BIFF/CSV readers; it is verification tooling, not part of the web app or gateway runtime.

The scheduled job runs this collector plus the independent check and a no-regression guard, then atomically swaps the package served at `GET api/market-data`. Source/package hashes, complete consecutive US years, FRED missing values, exact NYU headers and dividend-yield definitions are checked. Annual US coverage advances when the workbook and December CPI both contain the new complete year. China/FX arrays update calibration displays; future AR/FX assumptions remain user parameters. The app applies both sourced income rates and latest spot FX. A selected window that formerly ended at the latest year extends; a narrower window stays unchanged. No budget/allocation/risk settings are replaced. Failures keep the previous package and record the error in `status.json`.

Each completed/pinned run owns its original data snapshot. Download its run data package and TOML, then upload data before TOML after reload. The scientific package hash excludes retrieval timestamps, so identical source bytes/observations reproduce it. Manifests include the package and hash. Runtime package validation does not claim an independent audit of future provider revisions.

## Reproduce and verify offline

The public raw files and independent receipts are frozen in `verification/sources/`. No network or user confirmation is needed for verification.

```sh
python3 verification/reference/read-historical-source.py
python3 verification/reference/read-fred-source.py
npm run data:import -- --source-dir verification/sources/nyu-historical-returns-1928-2025 --us-cpi-csv verification/sources/fred/CPIAUCNS.csv --us-cpi-manifest verification/sources/fred/source-manifest.json --out-dir data/imported
npm run data:bundle
npm run data:verify
python3 verification/reference/check-refresh-source.py
npx vitest run tests/historical-data.test.ts tests/market-data.test.ts tests/stopping.test.ts
```

The independent Python readers use only the standard library. They do not import product calculations. The JS importer uses pinned SheetJS 0.20.3 BIFF8 support; it checks exact worksheet headers, declared units, finite cells and consecutive years. Import outputs stay `imported-unverified`. `data:bundle` activates them only after comparison with the independent receipts and raw hashes. `data:verify` independently reopens raw inputs and checks all 490 active US annual values, 39 China years, 45 FX years population calibration and both sourced income yields.

Calendar 2000–2002, 2008 and 2022 tapes run through the actual year engine against independently calculated balances, with and without beginning-year withdrawals. A production browser test checks the worker's reference version/hash and full-precision ledger return against independently decoded source values. `npm run data:verify` prints the source summary; `tests/historical-data.test.ts` runs the calendar replays.

The original synthetic rows are in git history at tag `verification-archive` (`verification/archive/pre-historical-data/`). Original M00 oracles remain unchanged; broader empirical Monte Carlo acceptance and legal/household completion are reported separately.
