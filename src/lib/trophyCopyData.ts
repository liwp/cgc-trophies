import type { ScoredFlight, LadderResult } from "../types";

export interface FlightDetail {
  pilot: string;
  date: Date;
  points: number;
  distanceKm: number;
  speedKph: number;
  task: string;
  ladderUrl: string;
  igcUrl: string;
}

export function formatPilotName(name: string): string {
  const parts = name.split(", ");
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
}

function flightUrl(id: string): string {
  return `https://www.bgaladder.net/flightdetails/${id}`;
}

export function ladderFlightDetails(result: LadderResult): FlightDetail[] {
  return result.flights.map((f) => {
    const url = flightUrl(f.id);
    return {
      pilot: formatPilotName(f.pilot),
      date: f.date,
      points: f.task.crossCountryPoints,
      distanceKm: f.task.scoringDistanceKm,
      speedKph: f.task.handicappedSpeedKph,
      task: [f.task.start, ...f.task.turnpoints, f.task.finish].join("-"),
      ladderUrl: url,
      igcUrl: `https://igcviewer.bgaladder.net/?igc=https://api.bgaladder.net/api/FlightIGC/${f.id}`,
    };
  });
}

export interface SingleFlightDetail {
  date: Date;
  gliderType: string;
  gliderReg: string;
  handicappedDistanceKm: number;
  scoringDistanceKm: number;
  handicappedSpeedKph: number;
  task: string;
  score: { value: number; unit: string };
  ladderUrl: string;
  igcUrl: string;
}

export function flightFlightDetails(result: ScoredFlight): SingleFlightDetail {
  const { id, date, glider, task, score } = result;
  return {
    date,
    gliderType: glider.type,
    gliderReg: glider.registration,
    handicappedDistanceKm: task.handicappedDistanceKm,
    scoringDistanceKm: task.scoringDistanceKm,
    handicappedSpeedKph: task.handicappedSpeedKph,
    task: [task.start, ...task.turnpoints, task.finish].join("-"),
    score,
    ladderUrl: flightUrl(id),
    igcUrl: `https://igcviewer.bgaladder.net/?igc=https://api.bgaladder.net/api/FlightIGC/${id}`,
  };
}

export function flightCopyData(result: ScoredFlight): [string, string][] {
  const { id, date, pilot, glider, task } = result;
  const pairs: [string, string][] = [
    ["Pilot Name", formatPilotName(pilot)],
    [
      "Date of Flight",
      date.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    ],
    ["Aircraft Type", glider.type],
    ["Aircraft Reg.", glider.registration],
    ["H/C Distance (kms)", task.handicappedDistanceKm.toFixed(2)],
    ["H/C Speed (kph)", task.handicappedSpeedKph.toFixed(2)],
    ["Ladder", flightUrl(id)],
  ];
  task.turnpoints.forEach((tp, i) => {
    pairs.push([`TP${i + 1}`, tp]);
  });
  return pairs;
}

export function ladderCopyData(
  result: LadderResult,
  groupBy: string,
): [string, string][] {
  const pilotName =
    groupBy === "registration"
      ? `${result.key} (${result.pilots.map(formatPilotName).join(", ")})`
      : formatPilotName(result.key);
  const pairs: [string, string][] = [
    ["Pilot Name", pilotName],
    ["Points", result.totalScore.toLocaleString("en-GB")],
    ["No. Of Flights", String(result.flights.length)],
    ["Scoring Distance (kms)", result.totalDistance.toFixed(2)],
  ];
  result.flights.forEach((f, i) => {
    const label =
      groupBy === "registration"
        ? `Flight ${i + 1} (${formatPilotName(f.pilot)})`
        : `Flight ${i + 1}`;
    pairs.push([label, flightUrl(f.id)]);
  });
  return pairs;
}

export function copyDataToClipboard(data: [string, string][]): Promise<void> {
  const text = data.map(([k, v]) => `${k}\t${v}`).join("\n");
  return navigator.clipboard.writeText(text);
}
