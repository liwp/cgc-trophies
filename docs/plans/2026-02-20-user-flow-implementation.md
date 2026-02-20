# User Flow Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate public leaderboard and admin dashboard views, add trophy navigation, and apply a clean visual design with Cambridge blue/teal accent.

**Architecture:** The existing home page splits into a clean public leaderboard (`/`) and a dense admin dashboard (`/admin`). Trophy detail pages gain next/prev navigation. Visual polish applied globally via Tailwind CSS v4 theme tokens and shared layout patterns. A helper module (`src/lib/trophyNav.ts`) provides trophy ordering logic used by both the detail page and admin dashboard.

**Tech Stack:** Next.js 15 (Pages Router), React 19, TypeScript, Tailwind CSS v4, lodash, lucide-react, SWR

**Design doc:** `docs/plans/2026-02-20-user-flow-design.md`

---

## Task 1: Visual Foundation — Theme & Layout

Set up the Cambridge blue/teal accent color in Tailwind v4 and create a shared page layout wrapper.

**Files:**
- Modify: `src/styles/globals.css`
- Create: `src/components/PageLayout.tsx`
- Modify: `src/components/Loading.tsx`

**Step 1: Add theme tokens to globals.css**

Replace the contents of `src/styles/globals.css` with:

```css
@import "tailwindcss";

@theme {
  --color-cambridge: #6cb4c4;
  --color-cambridge-dark: #5a9baa;
  --color-cambridge-light: #e8f4f7;
}
```

This makes `text-cambridge`, `bg-cambridge-light`, `border-cambridge-dark`, etc. available as Tailwind utilities.

**Step 2: Create PageLayout component**

Create `src/components/PageLayout.tsx`:

```tsx
function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {children}
      </div>
    </div>
  );
}

export default PageLayout;
```

**Step 3: Update Loading component to use PageLayout**

In `src/components/Loading.tsx`, wrap the spinner in PageLayout so the loading state matches the app layout. Remove `min-h-screen` from the inner div (PageLayout handles that).

```tsx
import PageLayout from "./PageLayout";

function Loading() {
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center py-32">
        <div
          className="h-10 w-10 animate-spin rounded-full"
          style={{
            border: "4px solid #e5e7eb",
            borderTopColor: "#6cb4c4",
          }}
        />
        <div className="mt-2 text-gray-500">Loading flight data...</div>
      </div>
    </PageLayout>
  );
}

export default Loading;
```

Note: spinner color changed from blue (`#3b82f6`) to Cambridge teal (`#6cb4c4`).

**Step 4: Run dev server and visually verify**

Run: `npm run dev`

Open http://localhost:3000 — the loading spinner should show centered in a max-width container on a light gray background, with the teal accent color.

**Step 5: Run existing tests**

Run: `npm test`

Expected: All existing tests pass (no logic changed).

**Step 6: Commit**

```bash
git add src/styles/globals.css src/components/PageLayout.tsx src/components/Loading.tsx
git commit -m "feat: add Cambridge teal theme tokens and PageLayout wrapper"
```

---

## Task 2: Simplify Public Home Page

Strip the home page down to a clean leaderboard table. Move CopyButton and WinnerDetails usage out.

**Files:**
- Modify: `src/pages/index.tsx`
- Modify: `src/components/Stats.tsx`

**Step 1: Rewrite the home page**

Replace `src/pages/index.tsx` with a clean leaderboard. Key changes:
- Remove `CopyButton`, `WinnerDetails` imports and components
- Remove `TrophyWinner` inline flight detail rendering
- Add `PageLayout` wrapper
- Each trophy row: name (link to detail page), winner name, score
- Stats bar wrapped in a card
- Admin link in top-right corner

```tsx
import React from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

import TROPHIES from "../lib/cgc_trophies";
import FlightLoadFailure from "../components/FlightLoadFailure";
import Loading from "../components/Loading";
import PageLayout from "../components/PageLayout";
import Season from "../components/Season";
import Stats from "../components/Stats";
import Tooltip from "../components/Tooltip";
import { trophyEval, ladderEval } from "../lib/eval";
import { formatPilotName } from "../lib/trophyCopyData";
import useFlights from "../lib/useFlights";
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  LadderResult,
  ScoredFlight,
} from "../types";

function formatScore(trophy: any): string {
  if (trophy.type === "ladder") {
    const lr = trophy.results[0] as LadderResult | undefined;
    return lr ? `${lr.totalScore.toFixed(0)} pts` : "";
  }
  const sf = trophy.results[0] as ScoredFlight | undefined;
  if (!sf) return "";
  const { value, unit } = sf.score;
  return unit === "pts" ? `${value.toFixed(0)} ${unit}` : `${value.toFixed(1)} ${unit}`;
}

function formatWinner(trophy: any): string {
  if (trophy.type === "ladder") {
    const lr = trophy.results[0] as LadderResult | undefined;
    if (!lr) return "No qualifying flights";
    return trophy.groupBy === "registration"
      ? `${lr.key} (${lr.pilots.map(formatPilotName).join(", ")})`
      : formatPilotName(lr.key);
  }
  const sf = trophy.results[0] as ScoredFlight | undefined;
  return sf ? formatPilotName(sf.pilot) : "No qualifying flights";
}

const TrophyList = ({ flights, season }: { flights: Flight[]; season: number }) => {
  const trophies = TROPHIES.trophies.map((trophy) => {
    const results =
      trophy.type === "ladder"
        ? ladderEval(TROPHIES.config, season, flights, trophy as LadderTrophy)
        : trophyEval(TROPHIES.config, season, flights, trophy as FlightTrophy);
    return { ...trophy, results, groupBy: (trophy as LadderTrophy).groupBy, season };
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trophy</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Winner</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Score</th>
          </tr>
        </thead>
        <tbody>
          {trophies.map((trophy) => {
            const hasResults = trophy.results.length > 0;
            return (
              <tr key={trophy.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/trophy/${trophy.id}?season=${season}`}
                    className="font-medium text-cambridge hover:text-cambridge-dark transition-colors"
                  >
                    {trophy.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {hasResults ? formatWinner(trophy) : (
                    <span className="text-gray-400 italic">No qualifying flights</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {hasResults ? formatScore(trophy) : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const TrophiesPage = () => {
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  return (
    <PageLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">CGC {season} Trophies</h1>
          <div className="flex items-center gap-4">
            <Season season={season} />
            <Tooltip text="Admin view">
              <Link href={`/admin?season=${season}`} className="p-2 rounded-lg text-gray-400 hover:text-cambridge hover:bg-cambridge-light transition-colors">
                <Settings size={18} />
              </Link>
            </Tooltip>
          </div>
        </div>
        <Stats flights={flights!} season={season} />
        <TrophyList flights={flights!} season={season} />
      </div>
    </PageLayout>
  );
};

export default TrophiesPage;
```

**Step 2: Wrap Stats in a card**

Update `src/components/Stats.tsx` — wrap the stats row in a card and remove the `min-w-[600px]`:

```tsx
import { calculateStats } from "../lib/stats";
import type { Flight } from "../types";

const FlightCategory = ({
  completed,
  label,
  total,
}: {
  completed?: number;
  label: string;
  total?: number;
}) => {
  return (
    <div className="text-center">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{completed || 0}</div>
      <div className="text-xs text-gray-400">of {total || 0} attempts</div>
    </div>
  );
};

const Stats = ({ flights, season }: { flights: Flight[]; season: number }) => {
  const start = new Date(`${season}-01-01`);
  const end = new Date(`${season}-12-31`);
  const flightsInYear = flights.filter(({ date }) => start <= date && date <= end);
  const stats = calculateStats(flightsInYear);

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
      <div className="flex justify-around">
        <FlightCategory label="All Flights" {...stats["open"]} />
        <FlightCategory label="300 km" {...stats["300km"]} />
        <FlightCategory label="400 km" {...stats["400km"]} />
        <FlightCategory label="500 km" {...stats["500km"]} />
        <FlightCategory label="750 km" {...stats["750km"]} />
      </div>
    </div>
  );
};

export default Stats;
```

**Step 3: Run dev server and visually verify**

Open http://localhost:3000 — should show the clean leaderboard: header with title + season picker + admin gear icon, stats card, trophy table with Cambridge teal links. No inline flight details.

**Step 4: Run existing tests**

Run: `npm test`

Expected: All pass.

**Step 5: Commit**

```bash
git add src/pages/index.tsx src/components/Stats.tsx
git commit -m "feat: simplify public home page to clean leaderboard"
```

---

## Task 3: Trophy Navigation Helper

Create a small utility for getting previous/next trophy IDs from the TROPHIES config. This is used by the trophy detail page.

**Files:**
- Create: `src/lib/trophyNav.ts`
- Create: `test/lib/trophyNav.test.ts`

**Step 1: Write the failing tests**

Create `test/lib/trophyNav.test.ts`:

```ts
import { getTrophyNav } from "../../src/lib/trophyNav";

describe("getTrophyNav", () => {
  it("returns prev and next for a middle trophy", () => {
    const nav = getTrophyNav("L2");
    expect(nav.current.id).toBe("L2");
    expect(nav.prev).not.toBeNull();
    expect(nav.prev!.id).toBe("L1");
    expect(nav.next).not.toBeNull();
    expect(nav.next!.id).toBe("L3");
  });

  it("returns null prev for the first trophy", () => {
    const nav = getTrophyNav("L1");
    expect(nav.prev).toBeNull();
    expect(nav.next).not.toBeNull();
  });

  it("returns null next for the last trophy", () => {
    const nav = getTrophyNav("1");
    expect(nav.next).toBeNull();
    expect(nav.prev).not.toBeNull();
  });

  it("returns nulls for unknown trophy ID", () => {
    const nav = getTrophyNav("unknown");
    expect(nav.prev).toBeNull();
    expect(nav.next).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/lib/trophyNav.test.ts`

Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `src/lib/trophyNav.ts`:

```ts
import TROPHIES from "./cgc_trophies";
import type { Trophy } from "../types";

export interface TrophyNav {
  current: Trophy;
  prev: Trophy | null;
  next: Trophy | null;
}

export function getTrophyNav(trophyId: string): TrophyNav {
  const list = TROPHIES.trophies;
  const index = list.findIndex((t) => t.id === trophyId);

  if (index === -1) {
    return {
      current: { id: trophyId, name: trophyId, description: "" } as Trophy,
      prev: null,
      next: null,
    };
  }

  return {
    current: list[index],
    prev: index > 0 ? list[index - 1] : null,
    next: index < list.length - 1 ? list[index + 1] : null,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/lib/trophyNav.test.ts`

Expected: All 4 tests PASS.

**Step 5: Commit**

```bash
git add src/lib/trophyNav.ts test/lib/trophyNav.test.ts
git commit -m "feat: add trophyNav helper for prev/next trophy navigation"
```

---

## Task 4: Update Trophy Detail Page

Add next/prev navigation, copy button on winner, remove trophy images, apply PageLayout and visual polish.

**Files:**
- Modify: `src/pages/trophy/[trophyId].tsx`

**Step 1: Rewrite the trophy detail page**

Key changes to `src/pages/trophy/[trophyId].tsx`:
- Import `PageLayout` and wrap the page
- Import `getTrophyNav` and render prev/next links at the top
- Remove `TrophyImage` component entirely
- Add `CopyButton` (from existing `trophyCopyData` helpers) to the winner row in both flight and ladder result lists
- Apply card styling (`rounded-xl border bg-white`) to the results section
- Use Cambridge teal for link colors

The nav bar at the top should look like:

```
← All Trophies                    ‹ Glass Jug | Presidents Trophy ›
```

The `AllTrophies` component already exists — update it and add the prev/next links alongside.

For the copy button: import `copyDataToClipboard`, `flightCopyData`, `ladderCopyData` from `trophyCopyData.ts`. Add a copy icon button next to the first result row in `ResultsList` and `LadderResultsList`.

This is a large file rewrite. The full replacement is the existing page with these specific modifications:
- Remove `TrophyImage` component and its usage
- Remove `sample` import from lodash (was for random image selection)
- Add `getTrophyNav` import and `TrophyNavBar` component
- Add `CopyButton` component (reuse the pattern from old index.tsx)
- Wrap in `PageLayout`
- Apply card and spacing styles

**Step 2: Run dev server and verify**

Open http://localhost:3000/trophy/L2?season=2025 — verify:
- Next/prev trophy links work and preserve season
- No trophy images shown
- Copy button present on first result
- Clean card layout with proper spacing

Click through a few trophies using next/prev to verify navigation, including first (L1, no prev) and last (1, no next).

**Step 3: Run tests**

Run: `npm test`

Expected: All pass.

**Step 4: Commit**

```bash
git add src/pages/trophy/[trophyId].tsx
git commit -m "feat: add next/prev navigation and copy button to trophy detail page"
```

---

## Task 5: Admin Dashboard

Create the admin page with all trophies, expandable results, per-entry copy buttons and BGA links.

**Files:**
- Create: `src/pages/admin.tsx`

**Step 1: Create the admin page**

Create `src/pages/admin.tsx`. This is the largest new file. Structure:

1. `AdminPage` — top-level component: uses `useFlights()`, renders PageLayout with header, stats, TOC, and all trophy sections
2. `TrophySection` — renders one trophy: heading with anchor, winner summary, expandable results
3. `FlightResultEntry` — one flight result row: rank, pilot, score, date, task, copy button, BGA link
4. `LadderResultEntry` — one ladder result row: rank, pilot/registration, total score, expandable flights, copy button, BGA links

Key details:
- Header: "CGC {season} Trophies — Admin" + season picker + "← Public view" link
- TOC: horizontal list of trophy names as anchor links (`#trophy-{id}`)
- Each trophy section has `id={`trophy-${trophy.id}`}` for anchor navigation
- Winner shown by default; "Show all results" button expands the full ranked list
- Each entry in the expanded list gets its own copy button (using `flightCopyData`/`ladderCopyData`) and BGA external link
- Top entry (rank 1) highlighted with `bg-cambridge-light`
- For ladder entries, individual flights shown nested when that entry is expanded

The admin page evaluates all trophies the same way the current home page does (using `trophyEval`/`ladderEval`), so the data flow is identical.

**Step 2: Run dev server and verify**

Open http://localhost:3000/admin?season=2025 — verify:
- All trophies listed with TOC at top
- Anchor links scroll to the right section
- Expandable results work for both flight and ladder trophies
- Copy buttons work on each entry
- BGA links open in new tab
- "Public view" link navigates back to `/`

**Step 3: Run tests**

Run: `npm test`

Expected: All pass.

**Step 4: Commit**

```bash
git add src/pages/admin.tsx
git commit -m "feat: add admin dashboard with expandable results and per-entry copy"
```

---

## Task 6: Polish Season Picker & Shared Components

Apply the visual design to the Season picker and other shared components.

**Files:**
- Modify: `src/components/Season.tsx`
- Modify: `src/components/FlightLoadFailure.tsx`
- Modify: `src/components/UnknownTrophy.tsx`

**Step 1: Update Season picker**

Update `src/components/Season.tsx`:
- Cambridge teal hover color on arrow buttons
- Slightly larger season text

```tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/router";

const firstYear = 2007;

const Season = ({ season }: { season: number }) => {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Previous season"
        className="p-1.5 rounded-lg hover:bg-cambridge-light hover:text-cambridge-dark disabled:opacity-30 transition-colors"
        disabled={season === firstYear}
        onClick={() =>
          router.replace({ query: { ...router.query, season: season - 1 } })
        }
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-lg font-semibold text-gray-900 tabular-nums min-w-[4ch] text-center">
        {season}
      </span>
      <button
        aria-label="Next season"
        className="p-1.5 rounded-lg hover:bg-cambridge-light hover:text-cambridge-dark disabled:opacity-30 transition-colors"
        disabled={season === currentYear}
        onClick={() =>
          router.replace({ query: { ...router.query, season: season + 1 } })
        }
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Season;
```

**Step 2: Update FlightLoadFailure**

Wrap in `PageLayout`, add styling:

```tsx
import PageLayout from "./PageLayout";

function FlightLoadFailure() {
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center py-32 text-gray-500">
        <p className="text-lg">Failed to load flight data.</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    </PageLayout>
  );
}

export default FlightLoadFailure;
```

**Step 3: Update UnknownTrophy**

Add PageLayout and styling:

```tsx
import Link from "next/link";
import PageLayout from "./PageLayout";

function UnknownTrophy({ trophyId }: { trophyId: string }) {
  return (
    <PageLayout>
      <div className="py-16 text-center">
        <p className="text-gray-700">
          Unknown trophy: <em className="text-cambridge-dark">{trophyId}</em>
        </p>
        <p className="mt-2">
          <Link href="/" className="text-cambridge hover:text-cambridge-dark transition-colors">
            Return to the main page
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}

export default UnknownTrophy;
```

**Step 4: Run dev server, verify all states**

- http://localhost:3000 — season picker arrows have teal hover
- Navigate to a bad trophy ID (e.g. `/trophy/zzz`) — styled error
- Stop the API (or break the URL temporarily) — styled loading failure

**Step 5: Run tests**

Run: `npm test`

Expected: All pass.

**Step 6: Commit**

```bash
git add src/components/Season.tsx src/components/FlightLoadFailure.tsx src/components/UnknownTrophy.tsx
git commit -m "feat: polish Season picker and error components with Cambridge teal theme"
```

---

## Task 7: Cleanup

Remove the stub route and unused code.

**Files:**
- Delete: `src/pages/season/[season]/trophy/[trophy].tsx`
- Optionally clean up: `src/pages/components.tsx` (showcase page — keep or remove per preference)

**Step 1: Delete the stub route**

Delete `src/pages/season/[season]/trophy/[trophy].tsx` — it renders raw JSON and uses a non-existent API endpoint (`/api/flights/${season}`). The proper route is `/trophy/[trophyId]`.

**Step 2: Verify no references to the deleted route**

Search the codebase for `/season/` links or references. There should be none — the route was standalone and not linked from anywhere.

**Step 3: Run tests**

Run: `npm test`

Expected: All pass.

**Step 4: Run build to verify no broken pages**

Run: `npm run build`

Expected: Build succeeds. No references to the deleted page.

**Step 5: Commit**

```bash
git rm src/pages/season/[season]/trophy/[trophy].tsx
git commit -m "chore: remove unused stub route /season/[season]/trophy/[trophy]"
```

---

## Task Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Theme tokens + PageLayout | `globals.css`, `PageLayout.tsx`, `Loading.tsx` |
| 2 | Clean public home page | `index.tsx`, `Stats.tsx` |
| 3 | Trophy nav helper (TDD) | `trophyNav.ts`, `trophyNav.test.ts` |
| 4 | Trophy detail page updates | `[trophyId].tsx` |
| 5 | Admin dashboard (new page) | `admin.tsx` |
| 6 | Polish shared components | `Season.tsx`, `FlightLoadFailure.tsx`, `UnknownTrophy.tsx` |
| 7 | Cleanup stub route | Delete `[trophy].tsx` |
