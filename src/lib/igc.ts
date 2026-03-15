import type {
  IgcTrackPoint,
  IgcTaskPoint,
  IgcData,
  HeightLossResult,
} from "../types";

function parseLat(s: string): number {
  const deg = parseInt(s.slice(0, 2), 10);
  const min = parseInt(s.slice(2, 7), 10) / 1000;
  const lat = deg + min / 60;
  return s[7] === "S" ? -lat : lat;
}

function parseLon(s: string): number {
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
      !/^C\d{6}\d{6}/.test(line)
    ) {
      task.push(parseCRecord(line));
    }
  }

  return { task, track };
}

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_M = 6371000;

function toXY(
  ref: { lat: number; lon: number },
  point: { lat: number; lon: number },
): [number, number] {
  const dLat = (point.lat - ref.lat) * DEG_TO_RAD;
  const dLon = (point.lon - ref.lon) * DEG_TO_RAD;
  const cosLat = Math.cos(ref.lat * DEG_TO_RAD);
  return [dLon * cosLat * EARTH_RADIUS_M, dLat * EARTH_RADIUS_M];
}

function cross2D(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

function perpendicularLine(
  ref: { lat: number; lon: number },
  center: { lat: number; lon: number },
  toward: { lat: number; lon: number },
  lengthM: number,
): [[number, number], [number, number]] {
  const [cx, cy] = toXY(ref, center);
  const [tx, ty] = toXY(ref, toward);

  const dx = tx - cx;
  const dy = ty - cy;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return [[cx, cy], [cx, cy]];

  const px = -dy / mag;
  const py = dx / mag;

  const half = lengthM / 2;
  return [
    [cx + px * half, cy + py * half],
    [cx - px * half, cy - py * half],
  ];
}

function getAltitude(pt: IgcTrackPoint): number {
  return pt.baroAlt > 0 ? pt.baroAlt : pt.gpsAlt;
}

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

    if (
      i > 0 &&
      prevSide !== 0 &&
      side !== 0 &&
      Math.sign(prevSide) !== Math.sign(side)
    ) {
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

const START_FINISH_LINE_LENGTH_M = 5000;

export function computeHeightLoss(data: IgcData): HeightLossResult | null {
  const { task, track } = data;

  // Task: TAKEOFF, start, TP1, ..., TPn, finish, LANDING (min 5 points)
  if (task.length < 5 || track.length < 2) return null;

  const start = task[1];
  const firstTP = task[2];
  const lastTP = task[task.length - 3];
  const finish = task[task.length - 2];

  const ref = start;

  const startLine = perpendicularLine(
    ref,
    start,
    firstTP,
    START_FINISH_LINE_LENGTH_M,
  );
  const finishLine = perpendicularLine(
    ref,
    finish,
    lastTP,
    START_FINISH_LINE_LENGTH_M,
  );

  const startCrossings = findCrossings(track, startLine[0], startLine[1], ref);
  const finishCrossings = findCrossings(
    track,
    finishLine[0],
    finishLine[1],
    ref,
  );

  if (startCrossings.length === 0 || finishCrossings.length === 0) return null;

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
