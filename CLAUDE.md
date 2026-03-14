# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Cambridge Gliding Centre annual trophies app. Fetches BGA Ladder flight data, scores flights against club trophy rules, and displays winners. Built with Next.js 15 (Pages Router), TypeScript, Tailwind CSS v4, SWR, and React 19.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals)
npm run prettier     # Format all files
npm test             # Run all tests (Jest)
npm test -- --watch  # Watch mode
npm test -- test/lib/eval.test.ts  # Run a single test file
```

## Architecture

### Data Flow

1. **External API**: `api.bgaladder.net/api/getlogfilescsv/{year}/{club}` returns CSV flight data
2. **API Route** (`src/pages/api/flights.ts`): Fetches CSV for year range, parses via `parseCsv()` with a field spec (`flightCsvSpec.ts`), returns JSON
3. **Client**: `useFlights()` hook (SWR) fetches `/api/flights?start=Y&end=Y`, filters to Gransden Lodge flights, resolves season from URL query
4. **Evaluation**: `trophyEval()` for flight trophies, `ladderEval()` for ladder trophies (`src/lib/eval.ts`)
5. **Config**: All club-specific config (club info, season, trophies) in `trophies.config.ts` at project root

### Trophy Types

- **FlightTrophy** (`type?: "flight"`): Uses a DSL of `[op, ...args]` expressions evaluated as a lodash chain. Operations: `filter`, `project`, `score`, `sort`. Each trophy's `expr` array defines its scoring pipeline.
- **LadderTrophy** (`type: "ladder"`): Groups flights by pilot or glider registration, takes top N by `crossCountryPoints`, sums scores. The Complicity Cup uses `groupBy: "registration"`, which requires at least 2 distinct pilots.

### Pages (Pages Router)

- `/` — Trophy winners summary table for current season
- `/trophy/[trophyId]` — Detailed results for a single trophy
- `/season/[season]/trophy/[trophy]` — Season+trophy combo route
- `/components` — Component showcase page

### Key Files

- `src/types.ts` — All shared types (Flight, Trophy, LadderResult, ScoredFlight, etc.)
- `src/lib/eval.ts` — Core scoring logic
- `trophies.config.ts` — Club config (name, code, launch site) and trophy definitions
- `src/pages/api/csv.ts` — CSV parser (papaparse + custom spec-based field parsing)
- `src/lib/trophyCopyData.ts` — Clipboard copy formatting for trophy results
- `src/lib/stats.ts` — Season statistics (completion rates, distance calculations)

## Code Conventions

### Intentional Patterns

- The `score` case in `trophyEval` intentionally falls through to `sort` (no `break` statement)
- The `<=>` comparator checks array equality in both directions (reversible routes like BUG-MEN or MEN-BUG)
- Season boundary: before March 1 = previous year's season (`useFlights.ts:currentSeason`)
- Fetches 3 years of data (season-1 to season+1) to handle cross-year trophies like Kelman Clock (Oct-Mar)

### Lodash

Import lodash as `import _ from "lodash"` (default import), then destructure. Do NOT use `import { chain } from "lodash"` or import from `lodash/chain` — Next.js 15 `optimizePackageImports` breaks standalone lodash modules.

### Styling

- Tailwind CSS v4 via `@tailwindcss/postcss` plugin (PostCSS config in `postcss.config.mjs`)
- Global CSS at `src/styles/globals.css` with just `@import "tailwindcss"`
- No component library — plain HTML + Tailwind utility classes
- Icons from `lucide-react` without prefix: `Check`, `Copy`, `ExternalLink`, etc.

### Testing

- Jest 30 with `babel-jest` using `next/babel` preset (configured inline in `jest.config.js`, no `.babelrc`)
- Tests in `test/` directory (excluded from `tsconfig.json` compilation)
- Tests import from `../../src/` paths (not aliases)
- Coverage thresholds set to 100% for all metrics
