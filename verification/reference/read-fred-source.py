#!/usr/bin/env python3
"""Independent FRED CSV extraction and calibration; Python standard library only."""
import csv
import hashlib
import json
import math
import statistics
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "verification/sources/fred"


def observations(series):
    values = {}
    with (SOURCE / (series + ".csv")).open(newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != ["observation_date", series]:
            raise ValueError("Unexpected FRED header")
        for row in reader:
            date, value = row["observation_date"], row[series]
            if date in values:
                raise ValueError("Duplicate FRED date")
            if value in ("", "."):
                continue
            number = float(value)
            if not math.isfinite(number):
                raise ValueError("Nonfinite FRED observation")
            values[date] = number
    return values


def moments(values):
    return {"mean": statistics.fmean(values), "sd": statistics.pstdev(values),
            "min": min(values), "max": max(values)}


def corr(x, y):
    mx, my = statistics.fmean(x), statistics.fmean(y)
    return statistics.fmean([(a - mx) * (b - my) for a, b in zip(x, y)]) / (
        statistics.pstdev(x) * statistics.pstdev(y))


def main():
    indices = observations("CPIAUCNS")
    december = {int(date[:4]): value for date, value in indices.items() if date[5:7] == "12"}
    us = [{"year": year, "us_cpi": december[year] / december[year - 1] - 1} for year in range(1928, 2026)]
    china = observations("FPCPITOTLZGCHN")
    cn = [{"year": year, "cn_cpi": china[f"{year}-01-01"] / 100} for year in range(1987, 2026)]
    year_ends = {}
    for date, value in sorted(observations("DEXCHUS").items()):
        year = int(date[:4])
        if 1981 <= year <= 2025:
            if value <= 0:
                raise ValueError("Nonpositive FX")
            year_ends[year] = {"year": year, "date": date, "usd_cny": value}
    fx = [year_ends[year] for year in range(1981, 2026)]
    cn_values = [row["cn_cpi"] for row in cn if row["year"] >= 1997]
    x, y = cn_values[:-1], cn_values[1:]
    mx, my = statistics.fmean(x), statistics.fmean(y)
    phi = statistics.fmean([(a - mx) * (b - my) for a, b in zip(x, y)]) / statistics.pvariance(x)
    intercept = my - phi * mx
    residuals = [b - intercept - phi * a for a, b in zip(x, y)]
    fx_values = [math.log(year_ends[year]["usd_cny"] / year_ends[year - 1]["usd_cny"]) for year in range(2006, 2026)]
    mf, sf = statistics.fmean(fx_values), statistics.pstdev(fx_values)
    nyu_receipt = ROOT / 'verification/sources/nyu-historical-returns-1928-2025/independent-acceptance.json'
    nyu = json.loads(nyu_receipt.read_text())
    joint = [{**row, 'us_cpi': us[i]['us_cpi']} for i, row in enumerate(nyu['independent_rows'])]
    series = ('us_stocks', 'us_bonds', 'usd_cash', 'us_cpi', 'us_home')
    joint_columns = {key: [r[key] for r in joint] for key in series}
    report = {"status": "PASS: independent FRED annual extraction and population calibration",
              "checked_at": datetime.now(timezone.utc).isoformat(),
              "reader_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "source_sha256": {series: hashlib.sha256((SOURCE / (series + ".csv")).read_bytes()).hexdigest()
                                for series in ("CPIAUCNS", "FPCPITOTLZGCHN", "DEXCHUS")},
              "us_cpi": us, "cn_cpi": cn, "usdcny": fx,
              "nyu_acceptance_sha256": hashlib.sha256(nyu_receipt.read_bytes()).hexdigest(),
              "us_history_moments": {key: moments(joint_columns[key]) for key in series},
              "us_history_correlation": [[corr(joint_columns[x], joint_columns[y]) for y in series] for x in series],
              "us_cpi_moments": moments([r["us_cpi"] for r in us]),
              "china_calibration": {"window": [1997, 2025], "observations": len(cn_values),
                                    "moments": moments(cn_values), "lag1_correlation": corr(x, y),
                                    "ar1": {"pairs": len(x), "phi": phi, "intercept": intercept,
                                            "long_run_mean": intercept / (1 - phi),
                                            "residual_sd": statistics.pstdev(residuals)}},
              "fx_calibration": {"window": [2006, 2025], "observations": len(fx_values),
                                 "log_return_moments": moments(fx_values),
                                 "excess_kurtosis": statistics.fmean([(v - mf)**4 for v in fx_values]) / sf**4 - 3},
              "scope": "Frozen FRED data and extraction. China/FX history supplies calibration references; scenario parameters still control future paths."}
    (SOURCE / "independent-acceptance.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"status": report["status"], "annual_rows": {"us": len(us), "china": len(cn), "fx": len(fx)},
                      "china_calibration": report["china_calibration"], "fx_calibration": report["fx_calibration"]}))


if __name__ == "__main__":
    main()
