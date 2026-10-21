#!/usr/bin/env python3
"""Independent raw-data reconciliation. Stdlib only; no app/SheetJS imports."""
import argparse
import csv
import hashlib
import importlib.util
import json
import math
import struct
from pathlib import Path

LIBRARY = Path(__file__).with_name("read-historical-source.py")
spec = importlib.util.spec_from_file_location("independent_biff", LIBRARY)
biff = importlib.util.module_from_spec(spec)
spec.loader.exec_module(biff)


def numeric_sheet(raw, name):
    stream = biff.workbook_stream(raw)
    offsets = []
    for kind, data in biff.records(stream):
        if kind == 0x0085:
            length, flags = data[6], data[7]
            label = data[8:8 + length * (2 if flags & 1 else 1)].decode(
                "utf-16le" if flags & 1 else "latin1")
            if label == name:
                offsets.append(struct.unpack_from("<I", data)[0])
    if len(offsets) != 1:
        raise ValueError("Missing/ambiguous BIFF sheet " + name)
    cells = {}

    def store(row, col, number):
        if not math.isfinite(number) or (row, col) in cells:
            raise ValueError("Duplicate/nonfinite numeric BIFF cell")
        cells[row, col] = number

    for kind, data in biff.records(stream, offsets[0]):
        if kind in (0x0203, 0x0006):
            row, col = struct.unpack_from("<HH", data)
            if kind == 0x0006 and data[12:14] == b"\xff\xff":
                continue
            store(row, col, struct.unpack_from("<d", data, 6)[0])
        elif kind == 0x027E:
            row, col = struct.unpack_from("<HH", data)
            store(row, col, biff.decode_rk(struct.unpack_from("<I", data, 6)[0]))
        elif kind == 0x00BD:
            row, first = struct.unpack_from("<HH", data)
            last = struct.unpack_from("<H", data, len(data) - 2)[0]
            if len(data) != 6 + (last - first + 1) * 6:
                raise ValueError("Invalid MULRK")
            for col in range(first, last + 1):
                store(row, col, biff.decode_rk(struct.unpack_from("<I", data, 6 + (col - first) * 6)[0]))
    return cells


def fred(path, series):
    with path.open(newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != ["observation_date", series]:
            raise ValueError("Wrong independent CSV header " + series)
        values, seen = {}, set()
        for row in reader:
            date = row["observation_date"]
            if date in seen or len(row) != 2:
                raise ValueError("Duplicate/malformed independent CSV row")
            seen.add(date)
            if row[series] in ("", "."):
                continue
            value = float(row[series])
            if not math.isfinite(value):
                raise ValueError("Nonfinite independent CSV value")
            values[date] = value
        return values


def match(actual, expected, name):
    if not math.isclose(actual, expected, rel_tol=0, abs_tol=1e-12):
        raise ValueError(f"Independent source mismatch {name}: {actual} vs {expected}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", default="verification/sources/market-refresh")
    args = parser.parse_args()
    source = Path(args.source_dir)
    package = json.loads((source / "market-data.json").read_text())
    raw = {key: (source / ("history.xls" if key == "NYU" else key + ".csv")).read_bytes()
           for key in ["NYU", "CPIAUCNS", "FPCPITOTLZGCHN", "DEXCHUS", "DGS10"]}
    hashes = {key: hashlib.sha256(value).hexdigest() for key, value in raw.items()}
    for item in package["sources"]:
        if hashes[item["id"]] != item["sha256"] or len(raw[item["id"]]) != item["bytes"]:
            raise ValueError("Public source raw hash/length mismatch")
    returns = numeric_sheet(raw["NYU"], "Returns by year")
    stock = numeric_sheet(raw["NYU"], "S&P 500 & Raw Data")
    us = fred(source / "CPIAUCNS.csv", "CPIAUCNS")
    cn = fred(source / "FPCPITOTLZGCHN.csv", "FPCPITOTLZGCHN")
    fx = fred(source / "DEXCHUS.csv", "DEXCHUS")
    bond = fred(source / "DGS10.csv", "DGS10")
    return_years = {int(value): row for (row, col), value in returns.items()
                    if col == 0 and 1928 <= value <= 2199 and value.is_integer()}
    for annual in package["history"]:
        row, year = return_years[annual["year"]], annual["year"]
        for key, col in [("us_stocks", 1), ("us_bonds", 4), ("usd_cash", 3), ("us_home", 6)]:
            match(annual[key], returns[row, col], f"{year}/{key}")
        match(annual["us_cpi"], us[f"{year}-12-01"] / us[f"{year - 1}-12-01"] - 1, f"{year}/US CPI")
    for annual in package["china_cpi"]:
        match(annual["cn_cpi"], cn[f'{annual["year"]}-01-01'] / 100, "China CPI")
    for annual in package["usd_cny"]:
        date = max(date for date in fx if date.startswith(str(annual["year"])))
        if date != annual["date"]:
            raise ValueError("FX row is not last available observation of its year")
        match(annual["usd_cny"], fx[date], "Year-end FX")
    end = package["history"][-1]["year"]
    stock_years = {int(value): row for (row, col), value in stock.items()
                   if col == 0 and 1927 <= value <= 2199 and value.is_integer()}
    dividend = stock[stock_years[end], 2]
    denominator = stock[stock_years[end - 1], 1]
    stock_yield = dividend / denominator
    match(stock_yield, stock[stock_years[end], 3], "Provider dividend yield formula")
    stock_input = package["income_yields"]["us_stocks"]
    for key, expected in [("value", stock_yield), ("numerator", dividend), ("denominator", denominator)]:
        match(stock_input[key], expected, "Stock yield " + key)
    bond_date = max(bond)
    if package["income_yields"]["us_bonds"]["date"] != bond_date:
        raise ValueError("Bond income observation is not the latest available")
    match(package["income_yields"]["us_bonds"]["value"], bond[bond_date] / 100, "DGS10 percent-to-decimal")
    latest_fx, latest_cn, latest_us = max(fx), max(cn), max(us)
    previous_us = str(int(latest_us[:4]) - 1) + latest_us[4:]
    for key, date, value in [("usd_cny", latest_fx, fx[latest_fx]), ("cn_cpi", latest_cn, cn[latest_cn] / 100),
                             ("us_cpi", latest_us, us[latest_us] / us[previous_us] - 1)]:
        if package["latest"][key]["date"] != date:
            raise ValueError("Latest observation date mismatch: " + key)
        match(package["latest"][key]["value"], value, "Latest " + key)
    report = {"status": "CHECKED", "method": "Independent stdlib OLE/BIFF and CSV readers; every annual value and both sourced income yields",
              "reader_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "biff_library_sha256": hashlib.sha256(LIBRARY.read_bytes()).hexdigest(),
              "source_sha256": hashes, "package_sha256": package["sha256"],
              "history_cells_checked": len(package["history"]) * 5,
              "china_rows_checked": len(package["china_cpi"]), "fx_rows_checked": len(package["usd_cny"]),
              "independent_stock_yield": stock_yield, "stock_dividends": dividend, "stock_opening_index": denominator,
              "independent_bond_yield": bond[bond_date] / 100, "bond_observation_date": bond_date}
    (source / "independent-acceptance.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report))


if __name__ == "__main__":
    main()
