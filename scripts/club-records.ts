#!/usr/bin/env bun
/**
 * List ladder flights that would beat the club records in records.config.ts.
 *
 * Only eligible flights count (club's own, launched at its site, declared and
 * completed) and speeds are actual speeds. Flights are walked in date order
 * under the FAI SC3 rules: a new record must beat the standing one by 1 km or
 * 1 km/h, triangles need FAI geometry, and speed flights must stay within the
 * 1000 m height-loss limit. Height records are never derived from ladder data.
 * Prints each candidate (later ones supersede earlier ones in a category), for
 * a human to approve; it never edits records.config.ts.
 *
 * Usage: bun run scripts/club-records.ts [lastSeason]
 */
import CONFIG from "trophies-config";
import records from "../records.config";
import { parseCsv } from "../src/lib/csv";
import { SPEC } from "../src/lib/flightCsvSpec";
import { flightDetailsUrl } from "../src/lib/links";
import { findCandidates } from "../src/lib/records";
import type { Flight } from "../src/types";

const FIRST_SEASON = 2007;
const URL = "https://api.bgaladder.net/api/getlogfilescsv";

const lastSeason = Number(process.argv[2] ?? new Date().getFullYear());

async function flightsFor(year: number): Promise<Flight[]> {
  const res = await fetch(`${URL}/${year}/${CONFIG.club.code}`);
  if (!res.ok) throw new Error(`Failed to fetch ${year}: ${res.status}`);
  return parseCsv(SPEC, await res.text());
}

async function main() {
  const flights: Flight[] = [];
  for (let year = FIRST_SEASON; year <= lastSeason; year++) {
    flights.push(...(await flightsFor(year)));
  }

  const candidates = findCandidates(records, flights);
  if (candidates.length === 0) {
    console.log("No candidate records.");
    return;
  }
  const blocks = candidates.map(({ category, flight, value, beats }) => {
    const beaten = beats === null ? "No claim" : beats.toFixed(1);
    return [
      `${category.label}: ${value.toFixed(1)} (beats: ${beaten})`,
      `  ${flight.pilot}, ${flight.date.toISOString().slice(0, 10)}, ${flight.glider.type}, ${flight.task.scoringDistanceKm.toFixed(1)} km`,
      `  ${flightDetailsUrl(flight.id)}`,
    ].join("\n");
  });
  console.log(blocks.join("\n\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
