import type { ScoredFlight, LadderResult } from "../types";

function formatPilotName(name: string): string {
  const parts = name.split(", ");
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
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
    ["Ladder", `https://www.bgaladder.net/flightdetails/${id}`],
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
  const totalDistance = result.flights.reduce(
    (sum, f) => sum + f.task.scoringDistanceKm,
    0,
  );
  return [
    ["Pilot Name", pilotName],
    ["Points", result.totalScore.toLocaleString("en-GB")],
    ["No. Of Flights", String(result.flights.length)],
    ["Scoring Distance (kms)", totalDistance.toFixed(2)],
  ];
}

export function copyDataToClipboard(data: [string, string][]): Promise<void> {
  const text = data.map(([k, v]) => `${k}\t${v}`).join("\n");
  return navigator.clipboard.writeText(text);
}
