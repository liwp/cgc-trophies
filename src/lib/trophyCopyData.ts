import type { ScoredFlight, LadderResult } from "../types";
import TURNPOINTS from "./turnpoints";

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

export function flightCopyData(result: ScoredFlight): string[][] {
  const { id, date, pilot, glider, task } = result;
  const rows: string[][] = [
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
    const row = rows[i + 1];
    if (row) {
      const fullName = TURNPOINTS[tp] || tp;
      row.push("", `TP${i + 1}`, `${tp} ${fullName}`);
    }
  });
  return rows;
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
  return pairs;
}

export function copyDataToClipboard(data: string[][]): Promise<void> {
  const text = data.map((row) => row.join("\t")).join("\n");
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}
