# AGENTS.md

This file provides guidance to coding agents (Claude Code, Codex, etc.) when working with code in this repository.

## Project

Cambridge Gliding Centre annual trophies app. Fetches BGA Ladder flight data, scores flights against club trophy rules, and displays winners. A purely client-side SPA built with Vite, React 19, React Router, TypeScript, Tailwind CSS v4, and SWR.

## Commands

This project uses **bun** as the package manager and script runner. Its version is pinned in both `mise.toml` (local, via `mise install`) and `package.json` `packageManager` (CI and Renovate); keep them equal. A different bun can rewrite `bun.lock` in another format and break `bun install --frozen-lockfile`.

```bash
bun install                          # Install dependencies (uses bun.lock)
bun run dev                          # Start dev server
bun run build                        # Production build
bun run lint                         # Biome check (lint + format + import sorting, read-only)
bun run typecheck                    # tsc for the app and the tests (CI runs this; vite build doesn't type-check)
bun run format                       # Biome check --write (apply fixes)
bun run test                         # Run all tests (Vitest) — use `bun run test`, NOT `bun test`
bun run test --watch                 # Watch mode
bun run test test/lib/eval.test.ts   # Run a single test file
bun run test:coverage                # Run tests with v8 coverage report
bun run test:e2e                     # Run Playwright end-to-end tests
```

Note: `bun test` invokes bun's native test runner, which bypasses Vitest and its
config — always use `bun run test` to run the Vitest suite.

## Architecture

### Data Flow

1. **External API**: `api.bgaladder.net/api/getlogfilescsv/{year}/{club}` returns CSV flight data (CORS-enabled)
2. **Client fetch** (`src/lib/fetchFlights.ts`): `fetchFlights(start, end)` fetches the CSV for the year range directly from the BGA API (no backend proxy) and parses it via `parseCsv()` (`src/lib/csv.ts`) with a field spec (`src/lib/flightCsvSpec.ts`)
3. **Client**: `useFlights()` hook (SWR) calls `fetchFlights()`, filters to Gransden Lodge flights, resolves season from URL query. The app has no API routes — it's purely client-side.
4. **Evaluation**: `trophyEval()` for flight trophies, `ladderEval()` for ladder trophies (`src/lib/eval.ts`)
5. **Config**: All club-specific config (club info, season, trophies) in `trophies.config.ts` at project root

### Trophy Types

- **FlightTrophy** (`type?: "flight"`): Uses a DSL of `[op, ...args]` expressions evaluated as a lodash chain. Operations: `filter`, `score`, `sort`. Each trophy's `expr` array defines its scoring pipeline. Expressions are typed (`TrophyExpr` in `src/types.ts`, with field paths derived from `Flight`), so a misspelt field, wrong comparator/value type, unit or sort order in `trophies.config.ts` is a compile error; `test/lib/trophyExpr.test.ts` pins down what is rejected.
- **LadderTrophy** (`type: "ladder"`): Groups flights by pilot or glider registration, takes top N by `crossCountryPoints`, sums scores. The Complicity Cup uses `groupBy: "registration"`, which requires at least 2 distinct pilots.

### Season-scoped trophy history

A trophy's headline `description`/`expr` describe the CURRENT task definition. When a trophy's task changes (e.g. its turnpoints), the OLD `description`/`expr` are preserved as an entry in `history: TrophyVersion[]`, each tagged with an inclusive `untilSeason` (the last season that version applied to). `resolveTrophy`/`resolveTrophies` (`src/lib/trophyHistory.ts`) pick the right version for a given season — the smallest `untilSeason` that is `>= season`, falling back to the headline fields if none match. Anything reading a trophy's `description` or `expr` for a specific season (scoring, UI display) MUST call `resolveTrophy`/`resolveTrophies` first rather than reading the trophy object directly. For example, a turnpoint change from 2026 onward looks like:

```ts
{
  id: "4",
  description: "…Bicester North West (BNW)…",
  expr: [["filter", "task.turnpoints", "<=>", ["BNW", "HUS"]], ...],
  history: [
    { untilSeason: 2025, description: "…Bicester Control Tower (BIC)…", expr: [["filter", "task.turnpoints", "<=>", ["BIC", "HUS"]], ...] },
  ],
}
```

### Routes (React Router)

Defined in `src/App.tsx`; the season is a `?season=` query param.

- `/` — Trophy winners summary table for the season
- `/trophy/:trophyId` — Detailed results for a single trophy
- `/admin` — Admin view (copy-to-clipboard, expanded results)
- `/components` — Component showcase page
- `*` — unknown paths redirect to `/`

### Key Files

- `src/types.ts` — All shared types (Flight, Trophy, LadderResult, ScoredFlight, etc.)
- `src/lib/eval.ts` — Core scoring logic
- `trophies.config.ts` — Club config (name, code, launch site) and trophy definitions
- `src/lib/csv.ts` — CSV parser (papaparse + custom spec-based field parsing)
- `src/lib/fetchFlights.ts` — fetches + parses BGA CSV directly from the client
- `src/lib/trophyCopyData.ts` — Clipboard copy formatting for trophy results
- `src/lib/stats.ts` — Season statistics (completion rates, distance calculations)
- `scripts/pilot-milestones.ts` — Derives `pilotMilestones` (first season with a declared, completed 300 km / 500 km task) from the club's BGA Ladder history and reports differences from `trophies.config.ts`; rerun each season. Changing milestones can change past results, so review the golden snapshot diff

## Code Conventions

### Intentional Patterns

- `score` ranks flights best-first (by `score.value`, descending; higher is better for km, kph and pts), so a trophy needs no `sort` unless it wants a different order. The trophies still list `["sort", "score.value", "desc"]` explicitly
- The `<=>` comparator checks array equality in both directions (reversible routes like BUG-MEN or MEN-BUG)
- Season boundary: before March 1 = previous year's season (`src/lib/season.ts:currentSeason`)
- Fetches 3 years of data (season-1 to season+1) to handle cross-year trophies like Kelman Clock (Oct-Mar)

### Lodash

Lodash may be imported either as a default import (`import _ from "lodash"`, then destructure) or named (`import { chain } from "lodash"`) — both work under Vite. (The old default-import-only rule was a Next.js `optimizePackageImports` workaround and no longer applies.)

### Styling

- Tailwind CSS v4 via the `@tailwindcss/vite` plugin (configured in `vite.config.ts`)
- Global CSS at `src/styles/globals.css` with just `@import "tailwindcss"`
- No component library — plain HTML + Tailwind utility classes
- Icons from `lucide-react` without prefix: `Check`, `Copy`, `ExternalLink`, etc.

### Testing

- Vitest 5, configured in the `test` block of `vite.config.ts` (`environment: "node"`, `globals: true`, setup in `test/setup.ts`)
- Tests in `test/` directory, excluded from `tsconfig.json` and type-checked separately via `tsconfig.test.json` (adds the `vitest/globals` types); `bun run typecheck` runs both
- Tests import from `../../src/` paths (not aliases)
- Component tests (`test/components/*.test.tsx`) render with `react-dom/server` `renderToStaticMarkup` and mock hooks with `vi.mock`; the environment has no DOM, so assert on the markup. Page-level behaviour and accessibility are covered by the Playwright suite (`e2e/`)
- Coverage via `@vitest/coverage-v8` (`bun run test:coverage`); `src/main.tsx`, `src/App.tsx`, presentational React (`src/pages/**`, `src/components/**`, `src/styles/**`, covered by the Playwright suite instead), and `*.d.ts` are excluded. An 80% threshold (statements, branches, functions, lines) is enforced in `vite.config.ts`; ratchet it upward as coverage improves, never lower it

## Beads (personal todo list)

This project uses **bd (beads)** as a single-user todo list. There is no team
workflow and no sync between machines.

```bash
bd ready                # What can be worked on now
bd list --status=open   # Everything open
bd show <id>            # Issue details
bd create --title="..." --description="..." --type=task --priority=2
bd update <id> --claim  # Mark in progress
bd close <id>           # Done
```

- Track follow-up work in `bd`, not in markdown TODO lists or TodoWrite.
- Issues live in a local Dolt DB under `.beads/` (gitignored). `.beads/issues.jsonl`
  is auto-exported on every change and committed by the pre-commit hook; it is
  the backup and history.
- The on-disk `issues.jsonl` can lag the DB, and the pre-commit hook re-exports
  it only after staging, so the commit gets a stale copy and the file shows as
  modified afterwards (`git commit -a` doesn't help: it stages before the hook
  runs). When committing beads changes, export first:
  `bd export -o .beads/issues.jsonl && git add .beads/issues.jsonl`.
- There is deliberately no Dolt remote. Ignore "no Dolt remote configured"
  warnings, and don't run `bd dolt remote add`, `bd dolt push`, or `bd sync`.
- Commit and push only when asked.

## Git

- Make a separate commit for each change that can stand on its own (e.g. a
  refactor, a behaviour fix it enables, a config or test-infrastructure
  change), not one commit per bead or PR. A PR may contain several commits.
- Merge PRs with "Rebase and merge" (or a merge commit) so those commits
  survive on `main`; squash merging collapses them into one.
- Switching branches or rebasing triggers the beads hooks, which rewrite
  `.beads/issues.jsonl` mid-operation and can block a pull or stall a rebase.
  Run such commands with `git -c core.hooksPath=/dev/null ...`, then re-export
  (`bd export -o .beads/issues.jsonl`) and check the file matches what's
  committed.

## Dependency updates (Renovate)

Renovate (`renovate.json`) opens weekly dependency PRs and keeps them rebased on
`main`. Lock file maintenance and minor/patch/pin/digest updates are
automerged by Renovate once every check passes; major updates wait for review
(read the release notes). Don't merge Renovate's non-major PRs by hand.

## Deployment

Netlify deploys `main` only when the commit message contains `[deploy]`
(production deploys cost credits; see README "Deployment"). Never add
`[deploy]` to a commit message or PR title unless asked to deploy.
