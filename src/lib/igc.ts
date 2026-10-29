import type {
  HeightLossResult,
  IgcData,
  IgcTaskPoint,
  IgcTrackPoint,
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

type LatLon = { lat: number; lon: number };

// Great-circle distance (m) and initial bearing (degrees) from a to b.
function toPoint(a: LatLon, b: LatLon): { distance: number; bearing: number } {
  const lat1 = a.lat * DEG_TO_RAD;
  const lat2 = b.lat * DEG_TO_RAD;
  const dLat = lat2 - lat1;
  const dLon = (b.lon - a.lon) * DEG_TO_RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const distance =
    2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) / DEG_TO_RAD + 360) % 360;
  return { distance, bearing };
}

/** Smallest angle (degrees, 0-180) between two bearings. */
function angleBetween(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Bearing halfway between two bearings, on the side of the smaller angle. */
function bisect(a: number, b: number): number {
  const x = Math.sin(a * DEG_TO_RAD) + Math.sin(b * DEG_TO_RAD);
  const y = Math.cos(a * DEG_TO_RAD) + Math.cos(b * DEG_TO_RAD);
  return (Math.atan2(x, y) / DEG_TO_RAD + 360) % 360;
}

// Observation zones, per the BGA Ladder rules (bgaladder.net/FileStore/PDF/
// RULES.pdf, 5.1 and 5.2). Turnpoints accept the 0.5km barrel or the FAI
// sector whatever the flight's sector type, as the ladder appears to
// (FAI-sector flights matched its height losses only with the barrel).
const START_RADIUS_M = 5000; // half the 10km start line
const FINISH_RADIUS_M = 5000; // half the 10km finish line
// Landing "anywhere on the airfield" finishes; we can't know the airfield's
// extent, so take a landing this close to the finish point.
const FINISH_AIRFIELD_RADIUS_M = 1000;
const TP_BARREL_RADIUS_M = 500;
const TP_SECTOR_RADIUS_M = 20000;
const SECTOR_HALF_ANGLE = 45; // 90-degree start, turnpoint and finish sectors

/**
 * Height loss between start and finish, assessing the flight against the task
 * declared in its IGC file under the BGA Ladder rules, in the way the BGA's
 * IGC viewer (igcviewer.bgaladder.net) does: only fixes between take-off and
 * landing count, a start is leaving the start zone (behind the 10km start line,
 * or the 90-degree start sector), the turnpoints are rounded in order, and the
 * finish is the first fix past the 10km finish line or in the finish sector
 * after the last turnpoint, or else landing on the finish airfield. Of the
 * valid starts before the first turnpoint, the pilot may pick any, so the one
 * giving the least height loss is used. Returns null unless every turnpoint
 * and the finish are reached.
 */
export function computeHeightLoss(data: IgcData): HeightLossResult | null {
  const { task, track } = data;

  // Task: TAKEOFF, start, TP1, ..., TPn, finish, LANDING (min 5 points)
  if (task.length < 5 || track.length < 2) return null;

  const coords = task.slice(1, -1);
  const last = coords.length - 1;
  const legBearing = coords
    .slice(1)
    .map((point, i) => toPoint(coords[i], point).bearing);
  // A turnpoint's sector faces away from the bisector of its legs.
  const sectorBearing = coords.map((point, i) =>
    i === 0 || i === last
      ? 0
      : (bisect(
          toPoint(point, coords[i - 1]).bearing,
          toPoint(point, coords[i + 1]).bearing,
        ) +
          180) %
        360,
  );

  // Pressure altitude unless the logger recorded none.
  const usePressure = track.some((fix) => fix.baroAlt !== 0);
  const altitude = (fix: IgcTrackPoint) =>
    usePressure ? fix.baroAlt : fix.gpsAlt;

  // Only assess the flight itself: from the first 4m climb to the last 4m
  // descent, so rolling past the finish after landing doesn't count.
  let takeOff = 1;
  for (let climb = 0; climb < 4 && takeOff < track.length; takeOff++) {
    climb += altitude(track[takeOff]) - altitude(track[takeOff - 1]);
  }
  takeOff--;
  let landing = track.length - 1;
  for (let descent = 0; descent < 4 && landing > 1; landing--) {
    descent += altitude(track[landing - 1]) - altitude(track[landing]);
  }

  // A start must be made in free flight (ladder rule 5.1). A launch only
  // climbs, so free flight begins with the first 20m drop below the highest
  // altitude so far.
  let release = takeOff;
  for (let top = altitude(track[takeOff]); release < landing; release++) {
    const alt = altitude(track[release]);
    if (alt <= top - 20) break;
    top = Math.max(top, alt);
  }

  const turnIndices: number[] = []; // fix that reached coords[n], n >= 1
  const starts: number[] = []; // fixes where the glider left the start zone
  let leg = -1; // -1 before the start zone, 0 in it, n heading for coords[n]
  for (let i = takeOff; i < landing && leg <= last; i++) {
    const fix = track[i];
    if (leg < 2) {
      const fromStart = toPoint(coords[0], fix);
      const inStartZone =
        (fromStart.distance < START_RADIUS_M &&
          angleBetween(fromStart.bearing, legBearing[0]) > 90) ||
        angleBetween(fromStart.bearing, legBearing[0]) >
          180 - SECTOR_HALF_ANGLE;
      if (inStartZone) {
        leg = 0;
      } else if (leg === 0) {
        leg = 1;
        if (i >= release) starts.push(i);
      }
    }
    if (leg < 1) continue;

    const target = coords[leg];
    let reached: boolean;
    if (leg === last) {
      const toFinish = toPoint(fix, target);
      reached =
        (toFinish.distance < FINISH_RADIUS_M &&
          angleBetween(toFinish.bearing, legBearing[leg - 1]) > 90) ||
        angleBetween(toFinish.bearing, legBearing[leg - 1]) >
          180 - SECTOR_HALF_ANGLE;
    } else {
      const fromTP = toPoint(target, fix);
      reached =
        fromTP.distance < TP_BARREL_RADIUS_M ||
        (fromTP.distance < TP_SECTOR_RADIUS_M &&
          angleBetween(fromTP.bearing, sectorBearing[leg]) < SECTOR_HALF_ANGLE);
    }
    if (reached) {
      turnIndices[leg] = i;
      leg++;
    }
  }

  // Landing on the finish airfield also finishes
  if (
    leg === last &&
    toPoint(coords[last], track[landing]).distance < FINISH_AIRFIELD_RADIUS_M
  ) {
    turnIndices[last] = landing;
    leg++;
  }
  if (leg <= last) return null;

  if (starts.length === 0) return null;
  // The pilot may pick any valid start before the last one (ladder rule 5.1
  // Note 1), so take the one that gives the least height loss.
  const start = starts.reduce((a, b) =>
    altitude(track[b]) < altitude(track[a]) ? b : a,
  );
  const startAltitude = altitude(track[start]);
  const finishAltitude = altitude(track[turnIndices[last]]);

  return {
    startAltitude,
    finishAltitude,
    heightLoss: startAltitude - finishAltitude,
  };
}
