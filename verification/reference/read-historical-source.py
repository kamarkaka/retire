#!/usr/bin/env python3
"""Independent, offline reader for the frozen NYU BIFF8 numeric worksheet.

Uses Python's standard library, not SheetJS or any product calculation. This
deliberately supports only regular OLE streams and BIFF8 numeric/cached-formula
cells needed by this workbook. Missing or unsupported cells fail explicitly.
"""
import hashlib
import json
import math
import statistics
import struct
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "verification/sources/nyu-historical-returns-1928-2025"
SERIES = ("us_stocks", "us_bonds", "usd_cash", "us_cpi", "us_home")
COLUMNS = {"year": 0, "us_stocks": 1, "us_bonds": 4, "usd_cash": 3,
           "us_cpi": 20, "us_home": 6}
FREE, END = 0xFFFFFFFF, 0xFFFFFFFE


def workbook_stream(raw):
    if raw[:8] != bytes.fromhex("d0cf11e0a1b11ae1"):
        raise ValueError("Expected OLE workbook")
    u16 = lambda offset: struct.unpack_from("<H", raw, offset)[0]
    u32 = lambda offset: struct.unpack_from("<I", raw, offset)[0]
    if u16(26) != 3 or u16(30) != 9 or u16(28) != 0xFFFE:
        raise ValueError("Expected little-endian OLE v3 with 512-byte sectors")
    sector_size = 512
    def sector(index):
        start = (index + 1) * sector_size
        value = raw[start:start + sector_size]
        if index >= len(raw) // sector_size - 1 or len(value) != sector_size:
            raise ValueError("Invalid OLE sector")
        return value
    difat = list(struct.unpack_from("<109I", raw, 76))
    next_difat = u32(68)
    for _ in range(u32(72)):
        words = struct.unpack("<128I", sector(next_difat))
        difat.extend(words[:-1])
        next_difat = words[-1]
    fat_sectors = [s for s in difat if s != FREE]
    if len(fat_sectors) != u32(44):
        raise ValueError("FAT count mismatch")
    fat = [v for s in fat_sectors for v in struct.unpack("<128I", sector(s))]
    def chain(first):
        chunks, seen, current = [], set(), first
        while current != END:
            if current in seen or current >= len(fat):
                raise ValueError("Invalid or circular OLE chain")
            seen.add(current)
            chunks.append(sector(current))
            current = fat[current]
        return b"".join(chunks)
    directory = chain(u32(48))
    for offset in range(0, len(directory), 128):
        entry = directory[offset:offset + 128]
        name_length = struct.unpack_from("<H", entry, 64)[0]
        name = entry[:max(0, name_length - 2)].decode("utf-16le")
        if name in ("Workbook", "Book") and entry[66] == 2:
            size = struct.unpack_from("<Q", entry, 120)[0]
            if size < u32(56):
                raise ValueError("Mini streams are unsupported by this source reader")
            return chain(struct.unpack_from("<I", entry, 116)[0])[:size]
    raise ValueError("Missing Workbook stream")


def records(stream, offset=0):
    while offset + 4 <= len(stream):
        kind, length = struct.unpack_from("<HH", stream, offset)
        end = offset + 4 + length
        if end > len(stream):
            raise ValueError("Truncated BIFF record")
        yield kind, stream[offset + 4:end]
        offset = end
        if kind == 0x000A:  # EOF for this globals/worksheet substream
            return
    raise ValueError("Missing BIFF EOF")


def decode_rk(encoded):
    if encoded & 2:
        signed = encoded if encoded < 2**31 else encoded - 2**32
        value = signed >> 2
    else:
        value = struct.unpack("<d", struct.pack("<II", 0, encoded & 0xFFFFFFFC))[0]
    return value / 100 if encoded & 1 else value


def read_rows(raw):
    stream = workbook_stream(raw)
    sheet_offset = None
    for kind, data in records(stream):
        if kind == 0x0085:  # BOUNDSHEET
            length, flags = data[6], data[7]
            name = data[8:8 + length * (2 if flags & 1 else 1)].decode(
                "utf-16le" if flags & 1 else "latin1")
            if name == "Returns by year":
                if sheet_offset is not None:
                    raise ValueError("Ambiguous worksheet")
                sheet_offset = struct.unpack_from("<I", data)[0]
    if sheet_offset is None:
        raise ValueError("Missing exact Returns by year worksheet")
    cells = {}
    def store(row, column, value):
        if 20 <= row < 118 and column in COLUMNS.values():
            if (row, column) in cells or not math.isfinite(value):
                raise ValueError("Duplicate or nonfinite source cell")
            cells[row, column] = value
    for kind, data in records(stream, sheet_offset):
        if kind in (0x0203, 0x0006):  # NUMBER / FORMULA cached numeric result
            row, column = struct.unpack_from("<HH", data)
            if kind == 0x0006 and data[12:14] == b"\xff\xff":
                continue  # nonnumeric formula cache; required cells then fail
            store(row, column, struct.unpack_from("<d", data, 6)[0])
        elif kind == 0x027E:  # RK
            row, column = struct.unpack_from("<HH", data)
            store(row, column, decode_rk(struct.unpack_from("<I", data, 6)[0]))
        elif kind == 0x00BD:  # MULRK
            row, first = struct.unpack_from("<HH", data)
            last = struct.unpack_from("<H", data, len(data) - 2)[0]
            if len(data) != 6 + (last - first + 1) * 6:
                raise ValueError("Invalid MULRK width")
            for column in range(first, last + 1):
                store(row, column, decode_rk(struct.unpack_from(
                    "<I", data, 6 + (column - first) * 6)[0]))
    rows = []
    for i in range(98):
        row = {key: cells[20 + i, column] for key, column in COLUMNS.items()}
        if row["year"] != 1928 + i:
            raise ValueError("Expected consecutive calendar years 1928–2025")
        row["year"] = int(row["year"])
        rows.append(row)
    if len(cells) != 98 * 6:
        raise ValueError("Incomplete numeric source-cell coverage")
    return rows


def portfolio_replay(rows, annual_spend):
    balance, years = 100000.0, []
    for row in rows:
        total_return = .4 * row["us_stocks"] + .6 * row["us_bonds"]
        ending = (balance - annual_spend) * (1 + total_return)
        years.append({"source_year": row["year"], "opening_usd": balance,
                      "withdrawal_usd": annual_spend, "return": total_return,
                      "ending_usd": ending})
        balance = ending
    return {"years": years, "ending_usd": balance}


def main():
    raw = (SOURCE / "history.xls").read_bytes()
    rows = read_rows(raw)
    moments, columns = {}, {}
    for key in SERIES:
        values = columns[key] = [r[key] for r in rows]
        moments[key] = {"mean": statistics.fmean(values), "sd": statistics.pstdev(values),
                        "min": min(values), "max": max(values)}
    correlation = [[statistics.fmean([
        (a - moments[x]["mean"]) * (b - moments[y]["mean"])
        for a, b in zip(columns[x], columns[y])]) / (moments[x]["sd"] * moments[y]["sd"])
        for y in SERIES] for x in SERIES]
    crisis_rows = [r for r in rows if r["year"] in (2000, 2001, 2002, 2008, 2022)]
    scenarios = {}
    for name, years in {"dotcom": (2000, 2001, 2002), "gfc": (2008,), "stocks_and_bonds_down": (2022,)}.items():
        tape = [r for r in rows if r["year"] in years]
        scenarios[name] = {"without_spending": portfolio_replay(tape, 0),
                           "with_spending": portfolio_replay(tape, 10000)}
    portfolio = [.4 * r["us_stocks"] + .6 * r["us_bonds"] for r in rows]
    def compound(shift):
        return math.expm1(statistics.fmean([math.log1p(r + shift) for r in portfolio]))
    lo, hi = -.5, .5
    for _ in range(100):
        mid = (lo + hi) / 2
        if compound(mid) < .03:
            lo = mid
        else:
            hi = mid
    report = {"status": "PASS: independent raw numeric cells and population arithmetic",
              "checked_at": datetime.now(timezone.utc).isoformat(),
              "reader": "Python standard library OLE v3 / BIFF8 numeric reader; independent of SheetJS and app",
              "reader_python_version": sys.version.split()[0],
              "reader_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "source_sha256": hashlib.sha256(raw).hexdigest(),
              "worksheet": "Returns by year", "first_data_row": 21,
              "zero_based_columns": COLUMNS, "rows_checked": 98,
              "return_cells_checked": 490, "year_cells_checked": 98,
              "independent_rows": rows, "moments": moments, "correlation": correlation,
              "crisis_rows": crisis_rows, "calendar_replays": scenarios,
              "stock_geometric_mean": math.expm1(statistics.fmean([math.log1p(v) for v in columns["us_stocks"]])),
              "portfolio_40_60_geometric_mean": compound(0),
              "three_percent_calibration": {"target": .03, "shift": (lo + hi) / 2},
              "scope": "Raw-cell fidelity to this provider workbook, not independent certification of provider methodology, future returns, China/FX assumptions or legal rules."}
    output = SOURCE / "independent-acceptance.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({k: report[k] for k in ("status", "source_sha256", "rows_checked",
          "return_cells_checked", "stock_geometric_mean", "portfolio_40_60_geometric_mean")}))


if __name__ == "__main__":
    main()
