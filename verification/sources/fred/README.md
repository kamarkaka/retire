# Frozen FRED references

Public CSVs retrieved 2026-10-19 UTC. [Metadata and raw SHA-256 hashes](source-manifest.json) and [independent extraction/calibration receipt](independent-acceptance.json) accompany the frozen files.

| Raw source | Active convention | Coverage |
|---|---|---|
| [CPIAUCNS.csv](CPIAUCNS.csv) | December CPI / previous December CPI − 1; not seasonally adjusted | US joint annual rows 1928–2025 |
| [FPCPITOTLZGCHN.csv](FPCPITOTLZGCHN.csv) | Annual-average China inflation, source percentage / 100 | 1987–2025; calibration 1997–2025 |
| [DEXCHUS.csv](DEXCHUS.csv) | Last valid daily CNY-per-USD observation in each calendar year | 1981–2025; log-return calibration 2006–2025 |

[Independent Python reader](../../reference/read-fred-source.py) uses CSV/statistics/math from the standard library and never imports product code. The JS verifier separately reproduces every annual extraction, population moment, correlation and AR(1)/FX calculation. Missing/nonfinite data fail explicitly.

China CPI and FX histories are calibration references. Future paths continue to use the user's configured AR(1), drift/PPP and volatility parameters. Later partial-year observations in the raw files are excluded from the annual reference windows.
