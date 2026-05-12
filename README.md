# jrddupont.github.io

A personal restaurant memory blog — a map and list of places I've been to and liked. If it's listed, I recommend it.

Live at **[jrddupont.github.io](https://jrddupont.github.io)**

## Features

- Interactive map (CartoDB/Leaflet) with clickable markers
- Filterable list by cuisine type and per-person price range
- Clicking a card or marker cross-links the two panels
- Dark/light theme following system preference

## Adding a restaurant

1. Add an entry to `_data/restaurants.json`:

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

`lat` and `lng` are optional — omit them and they'll be geocoded automatically (see below).

Multiple visits can be recorded in the `visits` array. The displayed price is the per-person average: `sum(cost) / sum(people)`.

2. Geocode locally (resolves `address` → `lat`/`lng`):

```bash
uv run python scripts/geocode.py
```

3. Commit and push. If any coordinates are still missing, the GitHub Actions workflow will geocode and commit them before GitHub Pages builds the site.

## Local development

```bash
bundle exec jekyll serve
```

Site available at `http://localhost:4000`.
