import {
  evaluateTrophy,
  formatScore,
  type TrophyResults,
  winnerFlights,
  winnerName,
  winnerScore,
} from "../../src/lib/results";
import type {
  Flight,
  FlightTrophy,
  LadderResult,
  LadderTrophy,
  ScoredFlight,
} from "../../src/types";

function makeFlight(overrides: Partial<Flight> & { id: string }): Flight {
  return {
    date: new Date("2024-06-15"),
    clubName: "Cambridge Gliding Centre",
    pilot: "Smith, Jane",
    glider: { type: "ASW 20", handicap: 100, registration: "G-TEST" },
    ladders: ["open"],
    task: {
      claimType: "C",
      isCompleted: true,
      crossCountryPoints: 100,
      isDeclared: true,
      scoringDistanceKm: 200,
      taskDistanceKm: 200,
      taskAchievement: "100% Completed",
      handicappedDistanceKm: 200,
      handicappedSpeedKph: 80,
      launchSite: "Gransden Lodge",
      start: "GRL",
      finish: "GRL",
      turnpoints: ["SHP"],
      heightLoss: 0,
    },
    ...overrides,
  };
}

const flightTrophy: FlightTrophy = {
  id: "F",
  name: "Speed",
  description: "Fastest flight",
  expr: [
    ["filter", "task.isCompleted"],
    ["score", "task.handicappedSpeedKph", "kph"],
    ["sort", "score.value", "desc"],
  ],
};

const ladderTrophy: LadderTrophy = {
  id: "L",
  type: "ladder",
  name: "Ladder",
  description: "Open ladder",
  ladderKey: "open",
  groupBy: "pilot",
  topN: 6,
};

const scored = (
  pilot: string,
  value: number,
  unit = "kph",
  id = pilot,
): ScoredFlight => ({ ...makeFlight({ id, pilot }), score: { value, unit } });

const ladderResult = (overrides: Partial<LadderResult>): LadderResult => ({
  key: "Smith, Jane",
  totalScore: 1234.4,
  totalDistance: 600,
  pilots: ["Smith, Jane"],
  flights: [],
  ...overrides,
});

// Narrow evaluateTrophy's result, failing the test if it's the wrong kind.
function flightResultsOf(evaluated: TrophyResults): ScoredFlight[] {
  if (evaluated.type !== "flight") {
    throw new Error(`expected flight results, got ${evaluated.type}`);
  }
  return evaluated.results;
}

function ladderResultsOf(evaluated: TrophyResults): LadderResult[] {
  if (evaluated.type !== "ladder") {
    throw new Error(`expected ladder results, got ${evaluated.type}`);
  }
  return evaluated.results;
}

describe("evaluateTrophy", () => {
  it("scores flight trophies from the launch-site flights", () => {
    const flights = [
      makeFlight({ id: "1", pilot: "Slow, Sam" }),
      makeFlight({
        id: "2",
        pilot: "Fast, Fay",
        task: { ...makeFlight({ id: "" }).task, handicappedSpeedKph: 95 },
      }),
    ];
    const elsewhere = makeFlight({ id: "3", pilot: "Away, Al" });

    const evaluated = evaluateTrophy(flightTrophy, 2024, {
      flights,
      allFlights: [...flights, elsewhere],
    });

    expect(flightResultsOf(evaluated).map((r) => r.id)).toEqual(["2", "1"]);
  });

  it("scores ladder trophies from all of the club's flights", () => {
    const local = makeFlight({ id: "1", pilot: "Home, Hal" });
    const elsewhere = makeFlight({ id: "2", pilot: "Away, Al" });

    const evaluated = evaluateTrophy(ladderTrophy, 2024, {
      flights: [local],
      allFlights: [local, elsewhere],
    });

    expect(
      ladderResultsOf(evaluated)
        .map((r) => r.key)
        .sort(),
    ).toEqual(["Away, Al", "Home, Hal"]);
  });

  it("applies the trophy version in force for the season", () => {
    const trophy: FlightTrophy = {
      ...flightTrophy,
      description: "Current task",
      expr: [["filter", "task.turnpoints", "<=>", ["BNW", "HUS"]]],
      history: [
        {
          untilSeason: 2023,
          description: "Old task",
          expr: [["filter", "task.turnpoints", "<=>", ["BIC", "HUS"]]],
        },
      ],
    };
    const task = makeFlight({ id: "" }).task;
    const flights = [
      makeFlight({
        id: "old",
        date: new Date("2023-06-15"),
        task: { ...task, turnpoints: ["BIC", "HUS"] },
      }),
      makeFlight({
        id: "new",
        date: new Date("2024-06-15"),
        task: { ...task, turnpoints: ["BNW", "HUS"] },
      }),
    ];

    const in2023 = evaluateTrophy(trophy, 2023, {
      flights,
      allFlights: flights,
    });
    const in2024 = evaluateTrophy(trophy, 2024, {
      flights,
      allFlights: flights,
    });

    expect(in2023.trophy.description).toBe("Old task");
    expect(flightResultsOf(in2023).map((r) => r.id)).toEqual(["old"]);
    expect(in2024.trophy.description).toBe("Current task");
    expect(flightResultsOf(in2024).map((r) => r.id)).toEqual(["new"]);
  });
});

describe("formatScore", () => {
  it.each([
    [{ value: 512.34, unit: "km" }, "512.3 km"],
    [{ value: 87.65, unit: "kph" }, "87.7 kph"],
    [{ value: 1234.4, unit: "pts" }, "1234 pts"],
  ])("formats %o as %s", (score, expected) => {
    expect(formatScore(score)).toBe(expected);
  });
});

describe("winner helpers", () => {
  const flightResults = (results: ScoredFlight[]): TrophyResults => ({
    type: "flight",
    trophy: flightTrophy,
    results,
  });
  const ladderResults = (
    results: LadderResult[],
    groupBy: LadderTrophy["groupBy"] = "pilot",
  ): TrophyResults => ({
    type: "ladder",
    trophy: { ...ladderTrophy, groupBy },
    results,
  });

  it("describes a flight trophy winner", () => {
    const winner = scored("Smith, Jane", 87.65);
    const evaluated = flightResults([winner, scored("Doe, John", 80)]);

    expect(winnerName(evaluated)).toBe("Jane Smith");
    expect(winnerScore(evaluated)).toBe("87.7 kph");
    expect(winnerFlights(evaluated)).toEqual([winner]);
  });

  it("describes a pilot ladder winner", () => {
    const flights = [makeFlight({ id: "1" }), makeFlight({ id: "2" })];
    const evaluated = ladderResults([ladderResult({ flights })]);

    expect(winnerName(evaluated)).toBe("Jane Smith");
    expect(winnerScore(evaluated)).toBe("1234 pts");
    expect(winnerFlights(evaluated)).toEqual(flights);
  });

  it("names a syndicate winner by registration with every pilot's full name", () => {
    const evaluated = ladderResults(
      [
        ladderResult({
          key: "G-CKYO",
          pilots: ["Smith, Jane", "Doe, John"],
        }),
      ],
      "registration",
    );

    expect(winnerName(evaluated)).toBe("G-CKYO (Jane Smith, John Doe)");
  });

  it("returns nothing when no flights qualified", () => {
    for (const evaluated of [flightResults([]), ladderResults([])]) {
      expect(winnerName(evaluated)).toBeUndefined();
      expect(winnerScore(evaluated)).toBeUndefined();
      expect(winnerFlights(evaluated)).toEqual([]);
    }
  });
});
