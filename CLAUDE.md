# CLAUDE.md

## What this is

A personal restaurant memory blog built with Jekyll and hosted on GitHub Pages. It is not a public review site — if a restaurant is listed, it means Jared liked it and wants to remember it. There is no rating system.

The site displays a filterable list of restaurants alongside an interactive map (CartoDB/Leaflet). Filters include a price slider (per-person average) and cuisine type checkboxes. Clicking a card or a map marker cross-links the two panels.

## Tech stack

- **Jekyll** (static site generator, built and hosted by GitHub Pages)
- **Leaflet.js** + **CartoDB Positron** tiles for the map
- **Nominatim** (OpenStreetMap) for geocoding addresses at compile time
- **uv** for running the Python geocoding script locally
- Plain CSS with `prefers-color-scheme` for dark/light theming — no frameworks

## Project structure

```
_data/restaurants.json   ← the only file you need to edit to add a restaurant
_layouts/default.html    ← base HTML shell (Leaflet loaded here)
assets/css/main.css      ← all styles
assets/js/main.js        ← all client-side logic (map, filters, interactions)
scripts/geocode.py       ← geocodes missing lat/lng from addresses
.github/workflows/geocode.yml  ← runs geocode.py automatically on push
```

## How to add a new restaurant

1. Open `_data/restaurants.json` and append a new entry:

```json
{
  "name": "Restaurant Name",
  "cuisine": "Cuisine Type",
  "description": "A short description.",
  "address": "123 Main St, City, ST 00000",
  "visits": [
    {"cost": 85.00, "people": 2}
  ]
}
```

- `lat` and `lng` are **optional** — omit them and they will be resolved automatically.
- `visits` is a list of trips. `cost` is the total bill; `people` is the group size. The displayed price is `sum(cost) / sum(people)`.
- Multiple visits: just add more objects to the `visits` array.

2. Run the geocoder locally to resolve coordinates before previewing:

```bash
uv run python scripts/geocode.py
```

3. Commit and push. If any entry is still missing `lat`/`lng`, the GitHub Actions workflow (`.github/workflows/geocode.yml`) will geocode and commit them automatically before GitHub Pages builds the site.

## Local development

```bash
bundle exec jekyll serve
```

The site will be available at `http://localhost:4000`.
