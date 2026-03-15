# Height Loss Verification Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Independently verify height loss from IGC files for top trophy flights and flag discrepancies where height loss > 1000m was not reported.

**Architecture:** New `src/lib/igc.ts` module parses IGC files and computes height loss by detecting start/finish line crossings. CSV spec adds `heightLoss` field to Flight type. Trophy detail page fetches IGC for #1 result and shows a warning if computed height loss disagrees with reported.

**Tech Stack:** TypeScript, React (client-side fetch), Jest for testing

**Spec:** `docs/superpowers/specs/2026-03-15-height-loss-verification-design.md`

---

## Chunk 1: IGC Parser and Height Loss Computation

### Task 1: IGC Types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add IGC types and heightLoss to Flight**

Add to `src/types.ts`:

```typescript
// After existing interfaces, add:

export interface IgcTrackPoint {
  time: string;
  lat: number;
  lon: number;
  baroAlt: number;
  gpsAlt: number;
}

export interface IgcTaskPoint {
  lat: number;
  lon: number;
  name: string;
}

export interface IgcData {
  task: IgcTaskPoint[];
  track: IgcTrackPoint[];
}

export interface HeightLossResult {
  startAltitude: number;
  finishAltitude: number;
  heightLoss: number;
}
```

Add `heightLoss` to the `task` field in `Flight`:

```typescript
// In Flight.task, add after existing fields:
heightLoss: number;
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add IGC and height loss types"
```

### Task 2: Add heightLoss to CSV spec

**Files:**
- Modify: `src/pages/api/flightCsvSpec.ts`
- Modify: `test/pages/api/flights/csv.test.ts`

- [ ] **Step 1: Add heightLoss field to TASK_SPEC**

In `src/pages/api/flightCsvSpec.ts`, add to `TASK_SPEC.src` after the `taskAchievement` entry:

```typescript
    heightLoss: {
      src: "Height loss",
      type: "number",
    },
```

- [ ] **Step 2: Update CSV test fixtures**

Any test that constructs flight objects will need `heightLoss` in the task. Check and update `test/pages/api/flights/csv.test.ts` to include the new field in expected output.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: All tests pass (existing tests may need fixture updates for the new field).

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/flightCsvSpec.ts test/
git commit -m "feat: add heightLoss field to flight CSV spec"
```

### Task 3: IGC B-record parser

**Files:**
- Create: `src/lib/igc.ts`
- Create: `test/lib/igc.test.ts`

The IGC B-record format is:
```
B HHMMSS DDMMmmmN/S DDDMMmmmE/W A PPPPP GGGGG
B 102455 5210976N   00006627W   A 00075 00075 0000
```
- Positions: time=1-7, lat=7-15, lon=15-24, validity=24, pressAlt=25-30, gpsAlt=30-35

- [ ] **Step 1: Write failing test for B-record parsing**

Create `test/lib/igc.test.ts`:

```typescript
import { parseIgc } from "../../src/lib/igc";

describe("parseIgc", () => {
  describe("B-record parsing", () => {
    it("parses lat, lon, and altitudes from a B-record", () => {
      const igc = [
        "HFDTE090925",
        "B1024555210976N00006627WA000750007500000",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.track).toHaveLength(1);

      const pt = result.track[0];
      expect(pt.time).toBe("102455");
      expect(pt.lat).toBeCloseTo(52.18293, 4);
      expect(pt.lon).toBeCloseTo(-0.11045, 4);
      expect(pt.baroAlt).toBe(75);
      expect(pt.gpsAlt).toBe(75);
    });

    it("parses east longitude as positive", () => {
      const igc = [
        "HFDTE090925",
        "B1024555210976N00006627EA000750007500000",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.track[0].lon).toBeCloseTo(0.11045, 4);
    });

    it("parses south latitude as negative", () => {
      const igc = [
        "HFDTE090925",
        "B1024555210976S00006627WA000750007500000",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.track[0].lat).toBeCloseTo(-52.18293, 4);
    });

    it("parses multiple B-records", () => {
      const igc = [
        "HFDTE090925",
        "B1024555210976N00006627WA000750007500000",
        "B1150015210354N00058982WA010050100500000",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.track).toHaveLength(2);
    });

    it("ignores non-B lines", () => {
      const igc = [
        "AXCSAAA",
        "HFDTE090925",
        "I023638FXA3940SIU",
        "B1024555210976N00006627WA000750007500000",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.track).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/lib/igc.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement parseIgc**

Create `src/lib/igc.ts`:

```typescript
import type {
  IgcTrackPoint,
  IgcTaskPoint,
  IgcData,
  HeightLossResult,
} from "../types";

function parseLat(s: string): number {
  // DDMMmmmN/S — e.g. "5210976N"
  const deg = parseInt(s.slice(0, 2), 10);
  const min = parseInt(s.slice(2, 7), 10) / 1000;
  const lat = deg + min / 60;
  return s[7] === "S" ? -lat : lat;
}

function parseLon(s: string): number {
  // DDDMMmmmE/W — e.g. "00006627W"
  const deg = parseInt(s.slice(0, 3), 10);
  const min = parseInt(s.slice(3, 8), 10) / 1000;
  const lon = deg + min / 60;
  return s[8] === "W" ? -lon : lon;
}

function parseBRecord(line: string): IgcTrackPoint {
  return {
    time: line.slice(1, 7),
    lat: parseLat(line.slice(7, 15)),
    lon: parseLon(line.slice(15, 24)),
    baroAlt: parseInt(line.slice(25, 30), 10),
    gpsAlt: parseInt(line.slice(30, 35), 10),
  };
}

function parseCRecord(line: string): IgcTaskPoint {
  // C DDMMmmmN/S DDDMMmmmE/W Name
  return {
    lat: parseLat(line.slice(1, 9)),
    lon: parseLon(line.slice(9, 18)),
    name: line.slice(18).trim(),
  };
}

export function parseIgc(content: string): IgcData {
  const lines = content.split(/\r?\n/);
  const track: IgcTrackPoint[] = [];
  const task: IgcTaskPoint[] = [];

  for (const line of lines) {
    if (line.startsWith("B") && line.length >= 35) {
      track.push(parseBRecord(line));
    } else if (
      line.startsWith("C") &&
      line.length >= 18 &&
      !/^C\d{6}\d{6}/.test(line) // skip first C-record (date/time header)
    ) {
      task.push(parseCRecord(line));
    }
  }

  return { task, track };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- test/lib/igc.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/igc.ts test/lib/igc.test.ts
git commit -m "feat: add IGC B-record and C-record parser"
```

### Task 4: IGC C-record (task) parser tests

**Files:**
- Modify: `test/lib/igc.test.ts`

- [ ] **Step 1: Add C-record tests**

Add to `test/lib/igc.test.ts`:

```typescript
  describe("C-record parsing", () => {
    it("parses task waypoints from C-records", () => {
      const igc = [
        "C090925102455000000000003",
        "C0000000N00000000ETAKEOFF",
        "C5211179N00006674WGRANSDEN LODGE",
        "C5155471N00100693WCALVERT RAIL JUNCTION",
        "C5250727N00051285WEASTWELL",
        "C5211179N00006674WGRANSDEN LODGE",
        "C0000000N00000000ELANDING",
      ].join("\n");

      const result = parseIgc(igc);
      // Should skip date header line, include TAKEOFF through LANDING
      expect(result.task).toHaveLength(6);
      expect(result.task[0].name).toBe("TAKEOFF");
      expect(result.task[1].name).toBe("GRANSDEN LODGE");
      expect(result.task[1].lat).toBeCloseTo(52.18632, 4);
      expect(result.task[1].lon).toBeCloseTo(-0.11123, 4);
      expect(result.task[5].name).toBe("LANDING");
    });

    it("skips C-record date header line", () => {
      const igc = [
        "C090925102455000000000003",
        "C5211179N00006674WGRANSDEN LODGE",
      ].join("\n");

      const result = parseIgc(igc);
      expect(result.task).toHaveLength(1);
    });
  });
```

- [ ] **Step 2: Run tests**

Run: `npm test -- test/lib/igc.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add test/lib/igc.test.ts
git commit -m "test: add IGC C-record parser tests"
```

### Task 5: Line crossing detection

**Files:**
- Modify: `src/lib/igc.ts`
- Modify: `test/lib/igc.test.ts`

The line crossing algorithm:
1. Given a line center point (the start/finish waypoint) and a bearing to the next/prev turnpoint, construct a 5km line perpendicular to that bearing.
2. For each pair of consecutive track points, check if they are on opposite sides of the line.
3. "Side" is determined by the sign of the cross product: `(lineEnd - lineStart) × (point - lineStart)`.
4. When a crossing is found, interpolate altitude linearly.

We work in a flat-earth approximation (lat/lon to metres) which is fine for 5km at UK latitudes.

- [ ] **Step 1: Write failing test for line crossing**

Add to `test/lib/igc.test.ts`:

```typescript
import { parseIgc, computeHeightLoss } from "../../src/lib/igc";

describe("computeHeightLoss", () => {
  // Helper: build a minimal IGC data structure with a straight-line track
  // Start at GRL (52.183, -0.111), TP at (52.0, -0.5), finish at GRL
  // Track goes: GRL -> south-west -> GRL
  // Start altitude 500m, finish altitude 400m => 100m height loss

  const grl = { lat: 52.183, lon: -0.111 };
  const tp = { lat: 52.0, lon: -0.5 };

  function makeIgcData(
    startAlt: number,
    finishAlt: number,
  ) {
    return {
      task: [
        { lat: 0, lon: 0, name: "TAKEOFF" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: tp.lat, lon: tp.lon, name: "TP1" },
        { lat: grl.lat, lon: grl.lon, name: "GRL" },
        { lat: 0, lon: 0, name: "LANDING" },
      ],
      track: [
        // Before start line (approaching from behind)
        { time: "100000", lat: 52.19, lon: -0.10, baroAlt: startAlt, gpsAlt: startAlt },
        // Cross start line (past GRL heading toward TP1 = south-west)
        { time: "100100", lat: 52.175, lon: -0.12, baroAlt: startAlt, gpsAlt: startAlt },
        // En route
        { time: "110000", lat: 52.05, lon: -0.45, baroAlt: 1500, gpsAlt: 1500 },
        // Near TP
        { time: "120000", lat: tp.lat, lon: tp.lon, baroAlt: 1200, gpsAlt: 1200 },
        // Returning
        { time: "130000", lat: 52.05, lon: -0.45, baroAlt: 800, gpsAlt: 800 },
        // Cross finish line (approaching GRL from south-west)
        { time: "140000", lat: 52.175, lon: -0.12, baroAlt: finishAlt, gpsAlt: finishAlt },
        // Past finish
        { time: "140100", lat: 52.19, lon: -0.10, baroAlt: finishAlt, gpsAlt: finishAlt },
      ],
    };
  }

  it("computes height loss from start to finish crossing", () => {
    const data = makeIgcData(500, 400);
    const result = computeHeightLoss(data);

    expect(result).not.toBeNull();
    expect(result!.heightLoss).toBeCloseTo(100, -1);
    expect(result!.startAltitude).toBeCloseTo(500, -1);
    expect(result!.finishAltitude).toBeCloseTo(400, -1);
  });

  it("returns negative height loss when finish is higher", () => {
    const data = makeIgcData(400, 600);
    const result = computeHeightLoss(data);

    expect(result).not.toBeNull();
    expect(result!.heightLoss).toBeLessThan(0);
  });

  it("returns null when task has no turnpoints", () => {
    const data = {
      task: [
        { lat: 0, lon: 0, name: "TAKEOFF" },
        { lat: 0, lon: 0, name: "LANDING" },
      ],
      track: [],
    };
    const result = computeHeightLoss(data);
    expect(result).toBeNull();
  });

  it("uses GPS altitude when baro is zero", () => {
    const data = makeIgcData(0, 0);
    // Override to have zero baro but valid GPS alt
    data.track = data.track.map((pt, i) => ({
      ...pt,
      baroAlt: 0,
      gpsAlt: i < 3 ? 500 : 400,
    }));

    const result = computeHeightLoss(data);
    expect(result).not.toBeNull();
    expect(result!.heightLoss).toBeCloseTo(100, -1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/lib/igc.test.ts`
Expected: FAIL — `computeHeightLoss` not found.

- [ ] **Step 3: Implement computeHeightLoss**

Add to `src/lib/igc.ts`:

```typescript
const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_M = 6371000;

/** Convert lat/lon to flat-earth x/y in metres relative to a reference point */
function toXY(
  ref: { lat: number; lon: number },
  point: { lat: number; lon: number },
): [number, number] {
  const dLat = (point.lat - ref.lat) * DEG_TO_RAD;
  const dLon = (point.lon - ref.lon) * DEG_TO_RAD;
  const cosLat = Math.cos(ref.lat * DEG_TO_RAD);
  return [dLon * cosLat * EARTH_RADIUS_M, dLat * EARTH_RADIUS_M];
}

/** Cross product of 2D vectors (ax,ay) and (bx,by) */
function cross2D(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

/**
 * Build a line of `lengthM` metres perpendicular to the bearing from
 * `center` toward `toward`, centered on `center`.
 * Returns two endpoints as [x,y] in the flat-earth frame.
 */
function perpendicularLine(
  ref: { lat: number; lon: number },
  center: { lat: number; lon: number },
  toward: { lat: number; lon: number },
  lengthM: number,
): [[number, number], [number, number]] {
  const [cx, cy] = toXY(ref, center);
  const [tx, ty] = toXY(ref, toward);

  // Direction vector from center to toward
  const dx = tx - cx;
  const dy = ty - cy;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return [[cx, cy], [cx, cy]];

  // Perpendicular (rotate 90°)
  const px = -dy / mag;
  const py = dx / mag;

  const half = lengthM / 2;
  return [
    [cx + px * half, cy + py * half],
    [cx - px * half, cy - py * half],
  ];
}

/**
 * Find all crossings of the track over a line segment.
 * Returns array of { index, fraction, altitude } where index is the
 * first track point index and fraction is interpolation [0,1].
 */
function findCrossings(
  track: IgcTrackPoint[],
  lineA: [number, number],
  lineB: [number, number],
  ref: { lat: number; lon: number },
): { index: number; altitude: number }[] {
  const [lax, lay] = lineA;
  const [lbx, lby] = lineB;
  const ldx = lbx - lax;
  const ldy = lby - lay;

  const crossings: { index: number; altitude: number }[] = [];
  let prevSide = 0;

  for (let i = 0; i < track.length; i++) {
    const [px, py] = toXY(ref, track[i]);
    const side = cross2D(ldx, ldy, px - lax, py - lay);

    if (i > 0 && prevSide !== 0 && side !== 0 && Math.sign(prevSide) !== Math.sign(side)) {
      // Crossing between i-1 and i — interpolate
      const t = Math.abs(prevSide) / (Math.abs(prevSide) + Math.abs(side));
      const altA = getAltitude(track[i - 1]);
      const altB = getAltitude(track[i]);
      crossings.push({
        index: i,
        altitude: altA + t * (altB - altA),
      });
    }
    prevSide = side;
  }

  return crossings;
}

function getAltitude(pt: IgcTrackPoint): number {
  return pt.baroAlt > 0 ? pt.baroAlt : pt.gpsAlt;
}

const START_FINISH_LINE_LENGTH_M = 5000;

export function computeHeightLoss(data: IgcData): HeightLossResult | null {
  const { task, track } = data;

  // Task structure: TAKEOFF, start, TP1, ..., TPn, finish, LANDING
  // Need at least: TAKEOFF, start, one TP, finish, LANDING = 5 points
  if (task.length < 5 || track.length < 2) return null;

  const start = task[1]; // first waypoint after TAKEOFF
  const firstTP = task[2]; // first turnpoint
  const lastTP = task[task.length - 3]; // last turnpoint
  const finish = task[task.length - 2]; // last waypoint before LANDING

  const ref = start; // reference point for flat-earth projection

  // Build start and finish lines
  const startLine = perpendicularLine(ref, start, firstTP, START_FINISH_LINE_LENGTH_M);
  const finishLine = perpendicularLine(ref, finish, lastTP, START_FINISH_LINE_LENGTH_M);

  // Find crossings
  const startCrossings = findCrossings(track, startLine[0], startLine[1], ref);
  const finishCrossings = findCrossings(track, finishLine[0], finishLine[1], ref);

  if (startCrossings.length === 0 || finishCrossings.length === 0) return null;

  // Start: last crossing in the first half of the track
  // Finish: first crossing in the second half
  const midIndex = Math.floor(track.length / 2);
  const startCrossing = startCrossings.filter((c) => c.index <= midIndex).pop();
  const finishCrossing = finishCrossings.find((c) => c.index >= midIndex);

  if (!startCrossing || !finishCrossing) return null;

  return {
    startAltitude: startCrossing.altitude,
    finishAltitude: finishCrossing.altitude,
    heightLoss: startCrossing.altitude - finishCrossing.altitude,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- test/lib/igc.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/igc.ts test/lib/igc.test.ts
git commit -m "feat: add height loss computation with line crossing detection"
```

## Chunk 2: CSV Field, React Hook, and UI

### Task 6: useHeightLoss hook

**Files:**
- Create: `src/lib/useHeightLoss.ts`

This hook fetches an IGC file for a given flight ID and computes the height loss. It runs client-side after the page loads.

- [ ] **Step 1: Create the hook**

Create `src/lib/useHeightLoss.ts`:

```typescript
import useSWR from "swr";
import { parseIgc, computeHeightLoss } from "./igc";
import type { HeightLossResult } from "../types";

async function fetchAndCompute(url: string): Promise<HeightLossResult | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  const igc = parseIgc(text);
  return computeHeightLoss(igc);
}

export function useHeightLoss(
  flightId: string | undefined,
): {
  result: HeightLossResult | null | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useSWR(
    flightId
      ? `https://api.bgaladder.net/api/FlightIGC/${flightId}`
      : null,
    fetchAndCompute,
    { revalidateOnFocus: false },
  );

  return { result: data, isLoading };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/useHeightLoss.ts
git commit -m "feat: add useHeightLoss hook for client-side IGC verification"
```

### Task 7: Height loss warning in flight trophy results

**Files:**
- Modify: `src/pages/trophy/[trophyId].tsx`

- [ ] **Step 1: Add HeightLossWarning component and integrate into Result**

Import the hook and add a warning component. Show it only on rank 1 flights where computed height loss > 1000m and reported height loss <= 1000m.

Add to `src/pages/trophy/[trophyId].tsx`:

```typescript
// Add imports:
import { useHeightLoss } from "../../lib/useHeightLoss";
import { AlertTriangle } from "lucide-react"; // add to existing lucide import

// New component:
const HeightLossWarning = ({ flightId, reportedHeightLoss }: {
  flightId: string;
  reportedHeightLoss: number;
}) => {
  const { result, isLoading } = useHeightLoss(flightId);

  if (isLoading || !result) return null;
  if (result.heightLoss <= 1000) return null;
  if (reportedHeightLoss > 1000) return null;

  return (
    <Tooltip
      text={`Computed height loss: ${Math.round(result.heightLoss)}m (reported: ${Math.round(reportedHeightLoss)}m)`}
    >
      <AlertTriangle size={16} className="text-red-500" />
    </Tooltip>
  );
};
```

In the `Result` component, add the warning next to the links for rank 1:

```typescript
// In the Result component's link cell, add after the IGC Viewer tooltip:
{rank === 1 && (
  <HeightLossWarning
    flightId={id}
    reportedHeightLoss={task.heightLoss}
  />
)}
```

- [ ] **Step 2: Add HeightLossWarning to LadderFlightRow for rank 1**

In `LadderResultRow`, pass `rank` down. In the expanded flight rows for rank 1, show the warning for each flight:

Modify `LadderFlightRow` to accept an optional `showHeightLoss` prop:

```typescript
const LadderFlightRow = ({
  flight,
  isSyndicate,
  showHeightLoss,
}: {
  flight: Flight;
  isSyndicate: boolean;
  showHeightLoss?: boolean;
}) => {
```

In the links cell of `LadderFlightRow`, add:

```typescript
{showHeightLoss && (
  <HeightLossWarning
    flightId={flight.id}
    reportedHeightLoss={flight.task.heightLoss}
  />
)}
```

In `LadderResultRow`, pass `showHeightLoss={rank === 1}` to each `LadderFlightRow`.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/trophy/[trophyId].tsx
git commit -m "feat: show height loss warning on top trophy flights"
```

### Task 8: Full test suite pass

- [ ] **Step 1: Run full test suite and fix any failures**

Run: `npm test`
Expected: All tests pass. Fix any issues with test fixtures needing the new `heightLoss` field.

Note: The 100% coverage threshold means `src/lib/igc.ts` and `src/lib/useHeightLoss.ts` must be fully covered. The igc.ts tests from Tasks 3-5 should cover the parser and computation. `useHeightLoss.ts` is a thin React hook — if coverage requires it, add a test or exclude it from coverage (it's a simple SWR wrapper).

- [ ] **Step 2: Commit any test fixes**

```bash
git add -A
git commit -m "test: fix test fixtures for heightLoss field"
```
