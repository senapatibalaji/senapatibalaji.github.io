"""Download public climate indices and write data/climate-indices.js.

Run from the website folder:  python3 data/update_indices.py
Uses only the Python standard library.
"""
import datetime
import json
import pathlib
import urllib.request

SOURCES = [
    {
        "id": "amv", "name": "AMV", "long": "Atlantic Multidecadal Variability", "unit": "°C",
        "url": "https://www.ncei.noaa.gov/pub/data/cmb/ersst/v5/index/ersst.v5.amo.dat",
        "about": "North Atlantic (0–60°N) SST anomaly from NOAA ERSSTv5, linearly detrended over the full record.",
        "credit": "NOAA NCEI, ERSSTv5", "detrend": True,
    },
    {
        "id": "nao", "name": "NAO", "long": "North Atlantic Oscillation", "unit": "std. units",
        "url": "https://www.cpc.ncep.noaa.gov/products/precip/CWlink/pna/norm.nao.monthly.b5001.current.ascii",
        "about": "Standardised monthly NAO index.",
        "credit": "NOAA Climate Prediction Center",
    },
    {
        "id": "nino34", "name": "Niño 3.4", "long": "El Niño–Southern Oscillation", "unit": "°C",
        "url": "https://psl.noaa.gov/data/timeseries/month/data/nino34.long.anom.data",
        "about": "SST anomaly in 5°N–5°S, 170°W–120°W, relative to 1981–2010.",
        "credit": "HadISST, via NOAA PSL",
    },
    {
        "id": "pdo", "name": "PDO", "long": "Pacific Decadal Oscillation", "unit": "index",
        "url": "https://www.ncei.noaa.gov/pub/data/cmb/ersst/v5/index/ersst.v5.pdo.dat",
        "about": "PDO index from NOAA ERSSTv5.",
        "credit": "NOAA NCEI, ERSSTv5",
    },
    {
        "id": "iod", "name": "IOD", "long": "Indian Ocean Dipole", "unit": "°C",
        "url": "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data",
        "about": "Dipole Mode Index: western minus south-eastern tropical Indian Ocean SST anomaly.",
        "credit": "HadISST, via NOAA PSL",
    },
    {
        "id": "sam", "name": "SAM", "long": "Southern Annular Mode", "unit": "index",
        "url": "https://legacy.bas.ac.uk/met/gjma/newsam.1957.2007.txt",
        "about": "Station-based index of the zonal-mean sea-level pressure difference between 40°S and 65°S.",
        "credit": "Marshall (2003), British Antarctic Survey",
    },
]


def is_year(tok):
    return tok.isdigit() and len(tok) == 4 and 1800 <= int(tok) <= 2100


def parse(text):
    """Return {(year, month): value} from 'year + 12 values' or 'year month value' rows."""
    out = {}
    for line in text.splitlines():
        tok = line.split()
        if len(tok) < 2 or not is_year(tok[0]):
            continue
        year = int(tok[0])
        if len(tok) == 3 and tok[1].isdigit() and 1 <= int(tok[1]) <= 12:
            pairs = [(int(tok[1]), tok[2])]                      # year month value
        elif "." in tok[1]:
            pairs = list(enumerate(tok[1:13], start=1))           # year + monthly values
        else:
            continue                                              # e.g. a "1870 2026" header
        for month, raw in pairs:
            v = float(raw)
            if -99 < v < 99:                                      # drop -99.99, 99.99, -9999 fills
                out[(year, month)] = v
    return out


def detrend(values):
    """Remove a least-squares linear trend, ignoring gaps."""
    pts = [(i, v) for i, v in enumerate(values) if v is not None]
    n = len(pts)
    mx = sum(i for i, _ in pts) / n
    my = sum(v for _, v in pts) / n
    slope = sum((i - mx) * (v - my) for i, v in pts) / sum((i - mx) ** 2 for i, _ in pts)
    return [None if v is None else v - my - slope * (i - mx) for i, v in enumerate(values)]


def main():
    series = []
    for src in SOURCES:
        req = urllib.request.Request(src["url"], headers={"User-Agent": "Mozilla/5.0"})
        data = parse(urllib.request.urlopen(req, timeout=60).read().decode("latin-1"))
        (y0, m0), (y1, m1) = min(data), max(data)
        months = [(y, m) for y in range(y0, y1 + 1) for m in range(1, 13)
                  if (y0, m0) <= (y, m) <= (y1, m1)]
        values = [data.get(k) for k in months]
        if src.get("detrend"):
            values = detrend(values)
        entry = {k: src[k] for k in ("id", "name", "long", "unit", "about", "credit", "url")}
        entry["start"] = [y0, m0]
        entry["values"] = [None if v is None else round(v, 3) for v in values]
        series.append(entry)
        print(f"{src['name']:9s} {y0}-{m0:02d} to {y1}-{m1:02d}  ({len(values)} months)")

    payload = {"updated": datetime.date.today().isoformat(), "series": series}
    out = pathlib.Path(__file__).with_name("climate-indices.js")
    out.write_text("window.CLIMATE_INDICES = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
                   encoding="utf-8")
    print(f"Wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
