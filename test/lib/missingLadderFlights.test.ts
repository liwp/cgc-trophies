import { readFileSync } from "node:fs";
import CONFIG from "trophies-config";
import { parseCsv } from "../../src/lib/csv";
import { SPEC } from "../../src/lib/flightCsvSpec";
import { missingLadderFlights } from "../../src/lib/missingLadderFlights";
import { selectSeasonFlights } from "../../src/lib/results";
import type { Flight, LadderTrophy, SeasonConfig } from "../../src/types";
import { makeFlight } from "../helpers/flight";

const defaultSeason: SeasonConfig = {
  start: { month: 1, day: 1 },
  end: { month: 12, day: 31 },
};

const fastrackers: LadderTrophy = {
  id: "L",
  type: "ladder",
  name: "Fastrackers",
  summary: "Test",
  description: "Novice ladder",
  ladderKey: "local5",
  groupBy: "pilot",
  topN: 2,
  excludePilotsWithMilestone: "300km",
};

const flight = (
  id: string,
  pilot: string,
  points: number,
  ladders: string[],
  clubName = "Cambridge Gliding Centre",
): Flight =>
  makeFlight({
    id,
    pilot,
    ladders,
    clubName,
    task: { crossCountryPoints: points },
  });

function missing(flights: Flight[], milestones = {}, excluded = {}) {
  const allFlights = flights.filter(
    (f) => f.clubName === "Cambridge Gliding Centre",
  );
  return missingLadderFlights(
    defaultSeason,
    2024,
    { allFlights, anyClubFlights: flights },
    fastrackers,
    { "300km": milestones },
    excluded,
  );
}

describe("missingLadderFlights", () => {
  it("lists Open Ladder flights missing from the ladder, with both totals", () => {
    const result = missing([
      flight("1", "Novice, Nat", 300, ["open", "local5"]),
      flight("2", "Novice, Nat", 500, ["open"]),
      flight("3", "Novice, Nat", 100, ["open"]),
    ]);

    expect(result).toEqual([
      {
        pilot: "Novice, Nat",
        currentScore: 300,
        potentialScore: 800,
        flights: [
          expect.objectContaining({ id: "2" }),
          expect.objectContaining({ id: "3" }),
        ],
      },
    ]);
  });

  it("skips pilots with nothing missing", () => {
    expect(
      missing([flight("1", "Novice, Nat", 300, ["open", "local5"])]),
    ).toEqual([]);
  });

  it("skips pilots who aren't novices for the season", () => {
    const result = missing([flight("1", "Expert, Eve", 500, ["open"])], {
      "Expert, Eve": 2020,
    });

    expect(result).toEqual([]);
  });

  it("counts flights filed under another club as missing", () => {
    // Its local5 flag is the other club's ladder, not ours.
    const result = missing([
      flight("1", "Novice, Nat", 400, ["open", "local5"], "Other Gliding Club"),
    ]);

    expect(result).toEqual([
      expect.objectContaining({
        pilot: "Novice, Nat",
        currentScore: 0,
        potentialScore: 400,
      }),
    ]);
  });

  it("ignores excluded flights", () => {
    expect(
      missing(
        [flight("1", "Novice, Nat", 400, ["open"])],
        {},
        {
          1: "duplicate claim",
        },
      ),
    ).toEqual([]);
  });

  it("sorts pilots by their potential total", () => {
    const result = missing([
      flight("1", "Low, Lee", 100, ["open"]),
      flight("2", "High, Hal", 900, ["open"]),
    ]);

    expect(result.map((r) => r.pilot)).toEqual(["High, Hal", "Low, Lee"]);
  });

  it("finds the 2024 Ted Warner Trophy pilots with no Fastrackers flights", () => {
    const fetched = [2023, 2024, 2025].flatMap((year) =>
      parseCsv(
        SPEC,
        readFileSync(
          new URL(`../../e2e/fixtures/${year}.csv`, import.meta.url),
          "utf8",
        ),
      ),
    );
    const tedWarner = CONFIG.trophies.find(
      (t): t is LadderTrophy => t.name === "Ted Warner Trophy",
    );
    expect(tedWarner).toBeDefined();

    const result = missingLadderFlights(
      CONFIG.season,
      2024,
      selectSeasonFlights(fetched, CONFIG.club),
      tedWarner as LadderTrophy,
      CONFIG.pilotMilestones,
      CONFIG.excludedFlights,
    );
    const byPilot = Object.fromEntries(result.map((r) => [r.pilot, r]));

    expect(byPilot["Grosche, Luise"]).toMatchObject({ currentScore: 0 });
    expect(byPilot["Clark, Aidan"]).toMatchObject({ currentScore: 0 });
    // Filed under Cambridge University Gliding Club by mistake.
    expect(byPilot["Grosche, Luise"].flights.map((f) => f.id)).toContain(
      "116657",
    );
  });
});
