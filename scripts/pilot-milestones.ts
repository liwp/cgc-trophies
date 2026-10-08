#!/usr/bin/env bun
/**
 * Derive pilotMilestones from the club's BGA Ladder history.
 *
 * A pilot achieves a milestone in the first season with a declared, completed
 * task whose scoring distance is at least the milestone distance (landouts
 * don't count). Compares the result with trophies.config.ts and prints:
 *   - pilots missing from the config, with their first qualifying season
 *   - conflicts: config years that differ from the data (0 sentinels are kept;
 *     they cover milestones flown before 2007 or with another club)
 *   - the merged pilotMilestones object, ready to paste into the config
 *
 * Usage: bun run scripts/pilot-milestones.ts [lastSeason]
 */
import CONFIG from "trophies-config";
import { parseCsv } from "../src/lib/csv";
import { SPEC } from "../src/lib/flightCsvSpec";
import type { Flight } from "../src/types";

const FIRST_SEASON = 2007;
const MILESTONES: Record<string, number> = { "300km": 300, "500km": 500 };
const URL = "https://api.bgaladder.net/api/getlogfilescsv";

const lastSeason = Number(process.argv[2] ?? new Date().getFullYear());

async function flightsFor(year: number): Promise<Flight[]> {
  const res = await fetch(`${URL}/${year}/${CONFIG.club.code}`);
  if (!res.ok) throw new Error(`Failed to fetch ${year}: ${res.status}`);
  return parseCsv(SPEC, await res.text()) as Flight[];
}

async function main() {
  const flights: Flight[] = [];
  for (let year = FIRST_SEASON; year <= lastSeason; year++) {
    flights.push(...(await flightsFor(year)));
  }
  const clubFlights = flights.filter((f) => f.clubName === CONFIG.club.name);

  const launchSites = new Map<string, number>();
  for (const f of clubFlights) {
    launchSites.set(
      f.task.launchSite,
      (launchSites.get(f.task.launchSite) ?? 0) + 1,
    );
  }

  const derived: Record<string, Record<string, number>> = {};
  for (const [milestone, km] of Object.entries(MILESTONES)) {
    derived[milestone] = {};
    for (const f of clubFlights) {
      const qualifies =
        f.task.isDeclared &&
        f.task.isCompleted &&
        f.task.scoringDistanceKm >= km;
      if (!qualifies) continue;
      const season = f.date.getUTCFullYear();
      const current = derived[milestone][f.pilot];
      if (current === undefined || season < current) {
        derived[milestone][f.pilot] = season;
      }
    }
  }

  const configured = CONFIG.pilotMilestones ?? {};
  const lines: string[] = [];
  lines.push(
    `Club flights ${FIRST_SEASON}-${lastSeason}: ${clubFlights.length}, pilots: ${new Set(clubFlights.map((f) => f.pilot)).size}`,
  );
  lines.push(
    `Launch sites: ${[...launchSites.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([s, n]) => `${s} (${n})`)
      .join(", ")}`,
  );

  const merged: Record<string, Record<string, number>> = {};
  for (const milestone of Object.keys(MILESTONES)) {
    const have = configured[milestone] ?? {};
    const found = derived[milestone];
    const missing = Object.keys(found)
      .filter((p) => !(p in have))
      .sort();
    const conflicts = Object.keys(have)
      .filter((p) => have[p] !== 0 && p in found && found[p] !== have[p])
      .sort();
    const unseen = Object.keys(have)
      .filter((p) => have[p] !== 0 && !(p in found))
      .sort();

    lines.push("", `== ${milestone} ==`);
    lines.push(
      `In config: ${Object.keys(have).length}; found in data: ${Object.keys(found).length}`,
    );
    lines.push(`Missing from config (${missing.length}):`);
    for (const p of missing) lines.push(`  ${JSON.stringify(p)}: ${found[p]}`);
    lines.push(`Config year differs from data (${conflicts.length}):`);
    for (const p of conflicts)
      lines.push(`  ${JSON.stringify(p)}: config ${have[p]}, data ${found[p]}`);
    lines.push(
      `Config year with no qualifying flight in data (${unseen.length}):`,
    );
    for (const p of unseen)
      lines.push(`  ${JSON.stringify(p)}: config ${have[p]}`);

    // Merge: keep every configured entry (including 0 sentinels and conflicts,
    // which need a human decision); add the missing pilots.
    merged[milestone] = { ...have };
    for (const p of missing) merged[milestone][p] = found[p];
  }

  lines.push("", "pilotMilestones (merged):", JSON.stringify(merged, null, 2));
  process.stdout.write(`${lines.join("\n")}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
