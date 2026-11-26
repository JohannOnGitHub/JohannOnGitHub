# Ski Base

A personal ski manager: gear, clothing, a log of days on snow, trips with live conditions, and resort discovery. Separate app from Pépette (the repo root); it lives in this folder.

## Sections
- **Gear**: park, all-mountain/freeride and touring checklists. Mark each item Have / Missing / Replace / Not needed, add the model and notes. Shows essentials coverage and a shopping list.
- **Clothing**: layers tagged by condition (deep cold, normal, spring, storm, touring uphill) with readiness per condition.
- **Log**: days with date, resort, type of skiing, snow, weather, new snow, temperature, best hit and rating. Stats per season and type.
- **Trips**: for each upcoming trip:
  - 16-day forecast at the top and base of the resort (snowfall, temperatures, wind, freezing level), highlighted on your ski days.
  - Avalanche bulletin: live for Norway (Varsom), Switzerland (SLF) and Tyrol (avalanche.report); links to the official bulletin for France and Sweden.
  - Snow depth on your dates over the last five seasons.
  - Travel options from Stockholm by plane, train, car and bus, with search links for your dates and warnings (French school holidays, changeover Saturdays).
  - Emergency numbers, useful apps, ski pass price and local rules.
  - A packing list built from your gear and clothing, with missing items flagged.
- **Resorts**: 24 resorts in Sweden, Norway, France, Switzerland and Austria. Filter by freeride, park, family, touring, glacier and more; sort by km, vertical, altitude or distance; load live snow and five-season averages.

## Data
Weather and snow come from [Open-Meteo](https://open-meteo.com/) (free, no key). Snow history is modelled (ERA5 reanalysis), good for comparing resorts and seasons. Resort figures and pass prices are approximate (checked November 2026); confirm on the resort's site.

Everything is saved in the browser. Export/import a backup file from the Home page. Optional sync between devices with a sync code:
1. Apply `supabase/migrations/20261127000000_skibase_sync.sql` to a Supabase project (the Pépette project works too).
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`).

## Development
```bash
cd ski
npm install
npm run dev
npm run build
```

## Deploy (Vercel)
Create a second Vercel project from this repo and set **Root Directory** to `ski`. Vite is detected automatically.
