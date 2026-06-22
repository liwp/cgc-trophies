# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Cambridge Gliding Centre annual trophies app. Fetches BGA Ladder flight data, scores flights against club trophy rules, and displays winners. Built with Next.js 15 (Pages Router), TypeScript, Tailwind CSS v4, SWR, and React 19.

## Commands

This project uses **bun** as the package manager and script runner.

```bash
bun install                          # Install dependencies (uses bun.lock)
bun run dev                          # Start dev server
bun run build                        # Production build
bun run lint                         # Biome check (lint + format + import sorting, read-only)
bun run format                       # Biome check --write (apply fixes)
bun run test                         # Run all tests (Jest) — use `bun run test`, NOT `bun test`
bun run test --watch                 # Watch mode
bun run test test/lib/eval.test.ts   # Run a single test file
```

Note: `bun test` invokes bun's native test runner, which bypasses Jest and its
config — always use `bun run test` to run the Jest suite.

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


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->
