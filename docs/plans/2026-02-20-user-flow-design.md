# User Flow Improvements — Design

## Goals

Two audiences with distinct needs:

1. **Club members** (future): Casual browsing during the season — "who's winning?" at a glance, with drill-down to full results.
2. **Admin** (trophy awards organizer): Sequential review of all trophies, verify flights via BGA ladder, copy winner details to spreadsheet.

The current home page tries to serve both by cramming winner details inline. This design separates the concerns.

## Page Structure

### Public Home (`/`)

Clean, scannable leaderboard. Top to bottom:

1. **Header**: "CGC {season} Trophies" + season picker (existing chevron arrows)
2. **Stats bar**: Existing flight completion stats (All Flights, 300km, 400km, 500km, 750km) in a card
3. **Trophy table**: One row per trophy

| Trophy             | Winner     | Score    |
| ------------------ | ---------- | -------- |
| Pot Pewter Pringle | J. Smith   | 542 pts  |
| Mug Metal Machin   | R. Welford | 312.4 km |

- Trophy name links to `/trophy/[trophyId]`
- No copy buttons, no inline flight details, no expandable rows
- "No qualifying flights" in muted text when empty
- Small unobtrusive "Admin" link in header/footer corner, navigates to `/admin`

### Trophy Detail (`/trophy/[trophyId]`)

Keeps existing functionality with these changes:

- **Add next/prev trophy navigation** at the top alongside the back arrow. Order follows `cgc_trophies.ts`. Format: `<< All Trophies ... < Glass Jug | Presidents Trophy >`
- **Add copy button** on the winner/top result row
- **Remove trophy images** (most trophies don't have them)
- Keep: one-per-pilot toggle, expandable ladder flight rows, BGA external links, season picker

### Admin Dashboard (`/admin`)

Dense all-in-one page. Top to bottom:

1. **Header**: "CGC {season} Trophies — Admin" + season picker + link back to public view
2. **Stats bar**: Same as public home
3. **Table of contents**: Trophy names as anchor links for quick jumping
4. **All trophies in sequence**: Each as a distinct section

Each trophy section:

- **Trophy name** as heading (links to detail page), with anchor `id` (e.g. `#trophy-L1`)
- **Winner line**: Pilot name, score, date, task, glider. Click to expand.
- **Copy button + BGA links** next to winner line
- **Expandable results list**: All entries ranked. Each entry has its own copy button and BGA verification link. Top/current entry highlighted. For ladder trophies, individual flights nested beneath each entry.

```
 +-- Mug Metal Machin -------------------------+
 |                                             |
 |  v R. Welford . 312.4 km        [Copy] [L] |
 |                                             |
 |  +- All results --------------------------+ |
 |  | > 1. R. Welford  312.4 km   [Copy] [L] | |
 |  |   2. J. Smith    298.1 km   [Copy] [L] | |
 |  |   3. A. Jones    275.6 km   [Copy] [L] | |
 |  |   ...                                   | |
 |  +-----------------------------------------+ |
 |                                             |
 +---------------------------------------------+
```

### Navigation Between Views

- Public home: small "Admin" link in corner -> `/admin`
- Admin dashboard: link back to public view -> `/`
- Trophy detail: back arrow -> `/`, next/prev arrows -> sibling trophies
- Season is always a query param (`?season=YYYY`), shared across all views

### Cleanup

- Remove stub `/season/[season]/trophy/[trophy]` route (currently dumps raw JSON)
- Stop rendering trophy `img` fields (config can keep them for future use)

## Visual Design

**Mood**: Clean & airy. **Accent**: Cambridge blue/teal (~`#6cb4c4` range, to be fine-tuned).

### Layout & Spacing

- Max-width container (`max-w-4xl mx-auto`) with comfortable padding
- Generous vertical spacing between sections (`gap-8` to `gap-10`)
- Consistent page padding (`px-6 py-8` or similar)

### Cards & Surfaces

- Trophy sections (admin) and stats bar wrapped in light cards: white background, `rounded-xl`, soft `shadow-sm` or thin `border border-gray-200`
- No heavy shadows — flat and airy

### Typography

- Trophy names: semibold, Cambridge blue/teal for links
- Winner names: normal weight, dark gray
- Scores/units: slightly muted
- Hierarchy: page title `text-2xl`, section headings `text-lg`, body `text-sm`/`text-base`

### Accent Color Usage

- Link colors (trophy names, navigation)
- Active/selected states (highlighted entry in admin expandable list)
- Season picker arrows on hover
- Optional subtle top border on cards (`border-t-2 border-teal-500`)

### Tables

- Alternating row backgrounds (`even:bg-gray-50`) or hover highlights (`hover:bg-gray-50`)
- Rounded container around tables
- More cell padding than current `p-2`

### Transitions

- Smooth hover states and expand/collapse (`transition-colors`, `transition-all`)
- Admin/public toggle as a subtle pill or icon, not prominent

### Not Adding

- No dark mode
- No animations beyond hover/expand transitions
- No custom fonts (system font stack)
- No trophy images

## Error & Edge Cases

- **No qualifying flights**: Muted text, no copy button (both views)
- **Loading**: Existing `Loading` spinner component
- **API failure**: Existing `FlightLoadFailure` component
- **Season bounds**: Picker disabled at first year (2007) and current year
