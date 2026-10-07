import type { LadderResult, ScoredFlight } from "../types";
import TURNPOINTS from "./turnpoints";

export function formatPilotName(name: string): string {
  const parts = name.split(", ");
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
}

function flightUrl(id: string): string {
  return `https://www.bgaladder.net/flightdetails/${id}`;
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
      const fullName = TURNPOINTS[tp]?.name || tp;
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
