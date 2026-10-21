# Frozen NYU annual-return source

[Public workbook](https://pages.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls), downloaded 2026-10-19 UTC. The frozen bytes are [history.xls](history.xls); SHA-256 `28b8110916a15a4dcc11c87c6422510704608ddedcdfa67a1298abdc22e49c69`.

The worksheet is `Returns by year`, header row 20, data rows 21–118. Exact named columns and decimal units are in [columns.json](columns.json). All 98 year cells and 490 numeric series cells match the independent Python standard-library OLE/BIFF reader and SheetJS importer. [Independent receipt](independent-acceptance.json), [source metadata](source-manifest.json), [reader](../../reference/read-historical-source.py).

The active bundle uses four workbook return columns, 392 values. It replaces the workbook inflation column with FRED December-to-December CPI; the workbook's 2025 inflation value uses a different period.

| Series | Meaning |
|---|---|
| US stocks | S&P 500 nominal annual total returns including dividends; older years use backfilled index history |
| US bonds | Reconstructed constant-maturity 10-year Treasury coupon and price return; not an aggregate bond fund |
| USD cash | Average 3-month Treasury-bill rate proxy; not a bank or fund return index |
| US home | Shiller/Case-Shiller price change; no rental income |

Raw-cell reconciliation verifies fidelity to this workbook. It does not independently audit the provider's index reconstruction. Engine tests replay annual 2000–2002, 2008 and 2022 rows, with and without beginning-year withdrawals, against independently calculated 40/60 Treasury portfolio balances.
