#!/usr/bin/env python3
"""
Geocodes any restaurant in _data/restaurants.json that has an 'address'
but is missing 'lat' and/or 'lng', using the Nominatim OSM API (no key needed).

Respects Nominatim's usage policy: 1 request per second, identifies the app
via User-Agent. Exits with code 1 if any address fails to resolve.
"""

import json
import re
import sys
import time
import urllib.parse
import urllib.request

DATA_FILE = "_data/restaurants.json"
USER_AGENT = "jrddupont.github.io restaurant-geocoder/1.0"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

KEY_ORDER = ["name", "cuisine", "description", "address", "lat", "lng", "visits"]


def geocode(address: str):
    params = urllib.parse.urlencode({"q": address, "format": "json", "limit": 1})
    req = urllib.request.Request(
        f"{NOMINATIM_URL}?{params}",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        results = json.loads(resp.read())
    if results:
        return float(results[0]["lat"]), float(results[0]["lon"])
    return None


def ordered_restaurant(r: dict) -> dict:
    """Return a new dict with keys in canonical order."""
    result = {k: r[k] for k in KEY_ORDER if k in r}
    # Include any unexpected extra keys at the end
    for k in r:
        if k not in result:
            result[k] = r[k]
    return result


def compact_visits(json_str: str) -> str:
    """Collapse each visit object onto a single line."""
    return re.sub(
        r'\{\s*\n\s*"cost":\s*([^,\n]+),\s*\n\s*"people":\s*([^\n]+)\s*\n\s*\}',
        r'{"cost": \1, "people": \2}',
        json_str,
    )


def write_json(path: str, data: list):
    raw = json.dumps([ordered_restaurant(r) for r in data], indent=2, ensure_ascii=False)
    raw = compact_visits(raw)
    with open(path, "w", encoding="utf-8") as f:
        f.write(raw)
        f.write("\n")


def main():
    with open(DATA_FILE, encoding="utf-8") as f:
        restaurants = json.load(f)

    changed = False
    errors = []

    for r in restaurants:
        if "lat" in r and "lng" in r:
            continue
        address = r.get("address")
        if not address:
            errors.append(f"  '{r.get('name', '?')}' has no address and no coordinates")
            continue

        print(f"Geocoding: {r['name']} ({address}) ...", end=" ", flush=True)
        time.sleep(1)  # Nominatim rate limit: max 1 req/s

        result = geocode(address)
        if result:
            r["lat"], r["lng"] = result
            print(f"→ {r['lat']:.6f}, {r['lng']:.6f}")
            changed = True
        else:
            print("FAILED")
            errors.append(f"  '{r['name']}': no result for address '{address}'")

    if errors:
        print("\nErrors:")
        for e in errors:
            print(e)
        sys.exit(1)

    if changed:
        write_json(DATA_FILE, restaurants)
        print("\nUpdated _data/restaurants.json with geocoded coordinates.")
    else:
        print("All restaurants already have coordinates — nothing to do.")


if __name__ == "__main__":
    main()
