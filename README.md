# Cambridge Gliding Centre Annual Trophies

A web app that works out the winners of [Cambridge Gliding
Centre](https://www.camgliding.uk/)'s annual cross-country trophies. It pulls
flight data for the season from the [BGA Ladder](https://www.bgaladder.net/),
scores each flight against the club's trophy rules, and shows the winners.

Live at **https://cgc-trophies.netlify.app**.

![Trophy winners page](docs/screenshot.png)

## How it works

1. The BGA Ladder publishes club flight data as CSV at `api.bgaladder.net`.
2. The client fetches and parses that CSV directly in the browser
   (`src/lib/fetchFlights.ts`) — there's no backend; it's a pure single-page app.
3. `useFlights` (+ SWR) loads the parsed data and filters to the club's home
   site.
4. The scoring engine (`src/lib/eval.ts`) evaluates each trophy's rules and
   produces the winners shown on the page.

All club-specific configuration — club details, season handling, and every
trophy definition — lives in **`trophies.config.ts`** at the project root, so
the app can be adapted to another gliding club by editing that one file.

To build for another club **without** editing the tracked config, point the
`TROPHIES_CONFIG` environment variable at an alternative config file (absolute,
or relative to the project root). The config is bundled statically, so this is
resolved at build time via a Vite alias:

```bash
TROPHIES_CONFIG=clubs/othertown.config.ts bun run build
```

When unset, it falls back to `trophies.config.ts`.

### Trophy types

- **Flight trophies** — scored from a small DSL of `[op, ...args]` expressions
  (`filter` / `score` / `sort`) evaluated over the season's flights.
- **Ladder trophies** — group flights by pilot (or glider registration), take
  the top N by cross-country points, and sum the scores.

## Tech stack

Vite · React 19 · React Router · TypeScript · Tailwind CSS v4 · SWR · Vitest.
Tooling: **bun** (package manager + scripts), **Biome** (lint + format), and
**Node 24 LTS** pinned via `mise`.

## Getting started

Prerequisites: [mise](https://mise.jdx.dev), which provides the pinned Node and
[bun](https://bun.sh) versions (see `mise.toml`; run `mise install`). The bun
version is also pinned in `package.json` (`packageManager`), which CI and
Renovate use, so `bun.lock` is always written by the same bun.

```bash
bun install          # install dependencies
bun run dev          # start the dev server at http://localhost:3000
bun run build        # production build
bun run test         # run the test suite (Vitest) — note: not `bun test`
bun run lint         # Biome check (lint + format + import sorting)
bun run format       # Biome auto-fix
```

## Deployment

The app is a purely static single-page app, hosted on **Netlify** at
[cgc-trophies.netlify.app](https://cgc-trophies.netlify.app), deployed from
`main`. Build settings live in
[`netlify.toml`](netlify.toml): `bun run build` produces `dist/`, which is
published as-is, with an SPA fallback (`/* → /index.html`) so client-router
paths like `/admin` and `/trophy/:id` resolve on direct visits and refreshes.

To set up hosting from scratch: in the Netlify dashboard, **Add new site →
Import an existing project**, connect this GitHub repo, and deploy — Netlify
reads `netlify.toml`, so no manual build configuration is needed.

Production deploys use up Netlify credits, so pushes to `main` only deploy when
the commit message contains `[deploy]` (an `ignore` rule in `netlify.toml`).
When squash-merging a PR, put `[deploy]` in its title. To deploy the current
`main` without other changes:

```bash
git commit --allow-empty -m "chore: release [deploy]" && git push
```

Deploy previews for pull requests are free and always build.

## Caveats

Results are automatic and derived entirely from the BGA Ladder, so they aren't
always the final word. Things we've run into:

- **Pilots changing clubs.** Updating a club on the BGA Ladder applies
  retroactively to all of that pilot's past flights, so they (and their past
  trophy wins) can disappear from the club's results.
- **"Novice"-type trophies.** Some trophies are restricted to pilots who
  haven't yet flown a given distance. The BGA Ladder has no notion of this, so
  we maintain a `pilotMilestones` list in `trophies.config.ts` (see below) —
  which needs manual upkeep.
- **Strict task rules.** A trophy limited to, say, "up to 3 turning points" is
  enforced exactly, even though an extra turnpoint added as a navigational aid
  might be acceptable in practice.
- **Missing uploads.** Flights that were never uploaded to the BGA Ladder
  can't be scored.

We also show only the **best qualifying flight per pilot** for each trophy — if
that flight turns out to be invalid, the next-best valid flight isn't shown.

Idea for the future: record historical winners explicitly, so results survive
flights vanishing from the BGA Ladder export and can override the algorithm's
idiosyncrasies.

## Managing pilot milestones

Some trophies are restricted to pilots who haven't yet achieved a distance
milestone (300km or 500km). The `pilotMilestones` section in
`trophies.config.ts` tracks which pilots achieved which milestones and when.
Trophies reference a milestone via `excludePilotsWithMilestone`, and all flights
from excluded pilots are filtered out.

Trophies with milestone exclusions:

| Trophy            | Milestone | Rule                                            |
| ----------------- | --------- | ----------------------------------------------- |
| The Boomerang     | 500km     | Excludes pilots who've completed a 500km flight |
| Double Century    | 300km     | Excludes pilots who've flown a 300km            |
| Slazenger Trophy  | 300km     | Excludes pilots who've flown a 300km            |
| Ted Warner Trophy | 300km     | Excludes pilots who've flown a 300km            |

A pilot is excluded from a season if their milestone year is **before** that
season (e.g. achieving 300km in 2024 means excluded from 2025 onwards, but still
eligible for 2024). A year of `0` means "always ineligible" — use this when the
milestone was achieved before we started tracking.

### Adding a pilot milestone

Use the helper script (run with bun):

```bash
# Achieved 300km in 2025
bun scripts/add-milestone.ts "Last, First" 300km 2025

# Always ineligible (year defaults to 0)
bun scripts/add-milestone.ts "Last, First" 500km
```

It adds the entry to `trophies.config.ts` and reformats it with Biome. It errors
if the pilot already exists in that milestone. Pilot names use `"Last, First"`
format, matching the BGA Ladder flight data.

## Yearly turnpoint update

`src/lib/turnpoints.ts` maps BGA turnpoint codes to names for the results and
copy-to-clipboard views. It is generated from the BGA's turnpoint file, which
the BGA updates about once a year, so after each new release:

1. Download the new `.cup` file (named like `BGA TPs 2026-06-10.cup`) from
   [navboys.com](https://www.navboys.com/downloads.html).
2. Regenerate the list, stamping codes added or retired with the season:

   ```bash
   python3 scripts/update-turnpoints.py "BGA TPs 2026-06-10.cup" --season 2026
   ```

   The script needs Python 3.10 or newer (on macOS, e.g.
   `uv run --python 3.12 scripts/update-turnpoints.py ...`). Retired codes are
   kept, stamped `removed`, because past seasons' flights still use them.
3. Check the codes it reports as retired against `trophies.config.ts`. If a
   trophy's task uses one, give the trophy a new task and keep the old one in
   its `history` (see AGENTS.md, "Season-scoped trophy history").
4. Commit `turnpoints.ts` as generated; don't edit it by hand.

## Club records

`records.config.ts` holds the club's records (fastest speeds over set distances,
distance records and heights). To find ladder flights that would beat them:

```bash
bun run scripts/club-records.ts 2026
```

It fetches every season from `checkedThroughSeason` in `records.config.ts`
(the last season reviewed; earlier ones are already reflected in the records)
to the one given and walks the eligible
flights (the club's own, launched at its site, declared and completed) in date
order, using actual speeds and the FAI SC3 rules: a new record must beat the
standing one by more than 1 km or 1 km/h, only the best flight of a day counts,
triangles need FAI geometry, and speed flights must stay within the 1000 m
height-loss limit. It lists every flight that would have broken a record, so a
category can show several in turn; the last one is the current record. Height records
are never derived from ladder data. The script only prints; a person approves
each candidate and edits `records.config.ts` by hand, then sets
`checkedThroughSeason` to the season just reviewed.

## License

[MIT](LICENSE)
