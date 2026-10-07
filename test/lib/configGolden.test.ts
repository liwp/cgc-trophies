// Golden test: scores the real trophy config against the committed e2e CSV
// fixtures and snapshots the top results per trophy per season. Any change to
// trophies.config.ts, trophy history resolution, CSV parsing or the scoring
// DSL that moves a podium shows up as a snapshot diff. Review such diffs
// deliberately; update with `bun run test -u` only when the change is intended.
import { readFileSync } from "node:fs";
import CONFIG from "trophies-config";
import { parseCsv } from "../../src/lib/csv";
import { ladderEval, trophyEval } from "../../src/lib/eval";
import { SPEC } from "../../src/lib/flightCsvSpec";
import { resolveTrophies } from "../../src/lib/trophyHistory";
import type { Flight, LadderResult, ScoredFlight } from "../../src/types";

const FIXTURE_SEASONS = [2022, 2023, 2024, 2025];
const PODIUM = 3;

function flightsForYear(year: number): Flight[] {
  try {
    const csv = readFileSync(
      new URL(`../../e2e/fixtures/${year}.csv`, import.meta.url),
      "utf8",
    );
    return parseCsv(SPEC, csv) as Flight[];
  } catch {
    // No fixture for this year (e.g. season + 1 of the latest season).
    return [];
  }
}

// Mirrors useFlights: fetch season-1..season+1, keep the club's flights
// (allFlights, used by ladders) and those launched from the club site (flights).
function flightsForSeason(season: number) {
  const allFlights = [season - 1, season, season + 1]
    .flatMap(flightsForYear)
    .filter((f) => f.clubName === CONFIG.club.name);
  const flights = allFlights.filter(
    (f) => f.task.launchSite === CONFIG.club.launchSite,
  );
  return { flights, allFlights };
}

const day = (date: Date) => new Date(date).toISOString().slice(0, 10);

function summariseFlight(f: ScoredFlight): string {
  const flags = [
    f.exclude && `excluded: ${f.exclude}`,
    f.include && `included: ${f.include}`,
  ].filter(Boolean);
  return [
    `${f.pilot} — ${f.score.value} ${f.score.unit}`,
    `(${f.id}, ${day(f.date)}, ${f.glider.registration})`,
    ...flags.map((flag) => `[${flag}]`),
  ].join(" ");
}

function summariseLadder(r: LadderResult): string {
  const ids = r.flights.map((f) => f.id).join(", ");
  return `${r.key} — ${r.totalScore} pts [${r.pilots.join("; ")}] (${ids})`;
}

// Mirrors the per-trophy dispatch in the pages (index, admin, trophy detail).
function podiums(season: number): Record<string, string[]> {
  const { flights, allFlights } = flightsForSeason(season);
  return Object.fromEntries(
    resolveTrophies(season).map((trophy) => {
      const top =
        trophy.type === "ladder"
          ? ladderEval(
              CONFIG.season,
              season,
              allFlights,
              trophy,
              CONFIG.pilotMilestones,
            )
              .slice(0, PODIUM)
              .map(summariseLadder)
          : trophyEval(
              CONFIG.season,
              season,
              flights,
              trophy,
              CONFIG.pilotMilestones,
            )
              .slice(0, PODIUM)
              .map(summariseFlight);
      return [`${trophy.id}: ${trophy.name}`, top];
    }),
  );
}

describe("trophy config golden results", () => {
  beforeEach(() => {
    // trophyEval logs every excluded/included flight; keep the output readable.
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(FIXTURE_SEASONS)("season %i", (season) => {
    const result = podiums(season);

    // Guard against a silently empty snapshot (e.g. fixtures failing to load).
    const withWinners = Object.values(result).filter((top) => top.length > 0);
    expect(withWinners.length).toBeGreaterThan(0);

    expect(result).toMatchSnapshot();
  });
});
