"""Build data/monsoon-rainfall.js for the Indian summer monsoon page.

Run from the website folder after data/update_indices.py:
    python3 data/update_monsoon.py
Uses only the Python standard library.

Each October, add the new season's all-India rainfall (% of the long period
average, from IMD's end-of-season report) to IMD_RECENT below.
"""
import datetime
import json
import pathlib
import statistics
import urllib.request

HERE = pathlib.Path(__file__).parent
IITM_URL = "https://mol.tropmet.res.in/images/iitm_aismr.txt"

# All-India June-September rainfall as % of IMD's long period average (LPA),
# from IMD end-of-season reports. IITM's homogeneous series ends in 2019.
IMD_RECENT = {
    2020: (109, "https://internal.imd.gov.in/press_release/20201001_pr_900.pdf"),
    2021: (99, "https://mausam.imd.gov.in/backend/assets/press_release_pdf/FNL_Salient_features_Monsoon_2021.pdf"),
    2022: (106, "https://internal.imd.gov.in/press_release/20221001_pr_1849.pdf"),
    2023: (94, "https://internal.imd.gov.in/press_release/20231001_pr_2555.pdf"),
    2024: (108, "https://mausam.imd.gov.in/newdelhi/archive/2025-12-12/press_release_en.pdf"),
    2025: (108, "https://internal.imd.gov.in/press_release/20250930_pr_4343.pdf"),
    2026: (87, "https://mausam.imd.gov.in/Forecast/marquee_data/extended_1790851278.pdf"),
}


def iitm_departures():
    req = urllib.request.Request(IITM_URL, headers={"User-Agent": "Mozilla/5.0"})
    out = {}
    for line in urllib.request.urlopen(req, timeout=60).read().decode("latin-1").splitlines():
        tok = line.split()
        if len(tok) == 2 and tok[0].isdigit() and len(tok[0]) == 4:
            out[int(tok[0])] = float(tok[1])
    return out


def jjas_detrended(series):
    """June-September mean of a monthly index, linearly detrended across complete seasons."""
    y0, m0 = series["start"]
    months = {}
    for i, v in enumerate(series["values"]):
        year, month = y0 + (m0 - 1 + i) // 12, (m0 - 1 + i) % 12 + 1
        if 6 <= month <= 9 and v is not None:
            months.setdefault(year, []).append(v)
    means = {y: sum(v) / 4 for y, v in months.items() if len(v) == 4}
    years = sorted(means)
    my, mv = statistics.mean(years), statistics.mean(means[y] for y in years)
    slope = sum((y - my) * (means[y] - mv) for y in years) / sum((y - my) ** 2 for y in years)
    return {y: means[y] - mv - slope * (y - my) for y in years}


def main():
    text = (HERE / "climate-indices.js").read_text(encoding="utf-8")
    series = {s["id"]: s for s in json.loads(text[text.index("{"):text.rindex("}") + 1])["series"]}
    nino, iod = jjas_detrended(series["nino34"]), jjas_detrended(series["iod"])

    rain = {y: (dep, "IITM") for y, dep in iitm_departures().items()}
    for y, (pct, _) in IMD_RECENT.items():
        rain.setdefault(y, (pct - 100, "IMD"))

    years = [{
        "y": y,
        "dep": round(dep, 2),
        "src": src,
        "nino": None if y not in nino else round(nino[y], 2),
        "iod": None if y not in iod else round(iod[y], 2),
    } for y, (dep, src) in sorted(rain.items())]

    payload = {
        "updated": datetime.date.today().isoformat(),
        "imdSources": {str(y): url for y, (_, url) in IMD_RECENT.items()},
        "years": years,
    }
    out = HERE / "monsoon-rainfall.js"
    out.write_text("window.MONSOON = " + json.dumps(payload, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"{years[0]['y']}-{years[-1]['y']}: {len(years)} seasons; wrote {out}")


if __name__ == "__main__":
    main()
