# Height Loss Verification Design

## Problem

Flights scored on the BGA ladder may have incorrect height loss values because pilots self-report this data. If a pilot loses more than 1000m altitude between start and finish, a distance penalty should apply. We want to independently verify height loss for top-scoring flights and flag discrepancies.

## Scope

Check only the #1 result per trophy. For ladder trophies, check each of the top pilot's contributing flights. For flight trophies, check the single winning flight.

## Design

### Data Flow

1. Trophy detail page identifies the top result
2. Client fetches the IGC file(s) from `https://api.bgaladder.net/api/FlightIGC/{flightId}`
3. IGC parser extracts the track (time, lat, lon, altitude) from B-records
4. Start/finish line crossing detector finds where the track crosses 5km lines perpendicular to the first/last leg
5. Height loss = altitude at start crossing - altitude at finish crossing
6. Compare computed height loss against reported value from CSV (`Height loss` column)
7. Flag flights where computed height loss > 1000m but reported height loss <= 1000m

### IGC Parsing (`src/lib/igc.ts`)

New module with these responsibilities:

**`parseIgc(content: string): IgcData`**
- Parse C-records to extract task declaration (start, turnpoints, finish coordinates)
- Parse B-records to extract track: `{ time: string, lat: number, lon: number, baroAlt: number, gpsAlt: number }[]`
- Use barometric altitude; fall back to GPS altitude when baro is zero or unavailable

**`computeHeightLoss(data: IgcData): HeightLossResult`**
- Build 5km start line perpendicular to the leg from start point to first turnpoint, centered on the start point
- Build 5km finish line perpendicular to the leg from last turnpoint to finish point, centered on the finish point
- Scan track for start line crossing: take the **last** crossing before the pilot moves away toward TP1
- Scan track for finish line crossing: take the **first** crossing when returning from the last TP
- Return `{ startAltitude, finishAltitude, heightLoss, startTime, finishTime }`

**Line crossing detection:**
- A line crossing occurs when consecutive B-records are on opposite sides of the line
- "Side of line" is determined by the sign of the cross product of the line direction vector and the vector from the line center to the point
- Interpolate altitude linearly between the two B-records at the crossing point

### CSV Data Addition

Add `Height loss` and `Distance Penalty` fields to `flightCsvSpec.ts` so the reported values are available for comparison. These are currently not parsed.

### Types

```typescript
interface IgcTrackPoint {
  time: string;
  lat: number;
  lon: number;
  baroAlt: number;
  gpsAlt: number;
}

interface IgcTask {
  points: { lat: number; lon: number; name: string }[];
}

interface IgcData {
  task: IgcTask;
  track: IgcTrackPoint[];
}

interface HeightLossResult {
  startAltitude: number;
  finishAltitude: number;
  heightLoss: number;
}
```

### UI Changes (Trophy Detail Page)

- For the #1 result, fetch the IGC file after the page loads
- Show a warning icon/highlight on the flight row if computed height loss > 1000m and reported height loss <= 1000m
- Tooltip on the warning showing: "Computed height loss: Xm (reported: Ym)"
- Loading state while IGC is being fetched/processed (subtle spinner or skeleton)
- If IGC fetch fails, show nothing (fail silently — this is supplementary info)

### Assumptions

- 5km start/finish lines (hardcoded for now)
- Lines are perpendicular to the adjacent leg
- Barometric altitude preferred, GPS altitude as fallback
- Only the #1 result per trophy is checked
- Client-side computation (no server-side IGC fetching)
- CORS must be available on the BGA IGC endpoint (already used by igcviewer)

### Testing

- Unit tests for IGC B-record and C-record parsing
- Unit tests for line crossing detection with known geometries
- Unit test for height loss computation with a synthetic track
