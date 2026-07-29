import { trophyEval } from "../../src/lib/eval";
import { resolveTrophy } from "../../src/lib/trophyHistory";
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  SeasonConfig,
} from "../../src/types";

const defaultSeason: SeasonConfig = {
  start: { month: 1, day: 1 },
  end: { month: 12, day: 31 },
};

const doubleCentury: FlightTrophy = {
  id: "4",
  name: "Double Century",
  description: "…Bicester North West (BNW)… 205.2km…",
  expr: [
    ["filter", "task.turnpoints", "<=>", ["BNW", "HUS"]],
    ["score", "task.handicappedSpeedKph", "kph"],
    ["sort", "score.value", "desc"],
  ],
  history: [
    {
      untilSeason: 2025,
      description: "…Bicester Control Tower (BIC)… 205.0km…",
      expr: [
        ["filter", "task.turnpoints", "<=>", ["BIC", "HUS"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
    },
  ],
};

function makeFlight(turnpoints: string[], date: Date): Flight {
  return {
    id: "f1",
    date,
    clubName: "Cambridge",
    pilot: "A Pilot",
    glider: { type: "ASW 20", handicap: 100, registration: "G-TEST" },
    ladders: ["open"],
    task: {
      claimType: "C",
      isCompleted: true,
      crossCountryPoints: 100,
      isDeclared: true,
      scoringDistanceKm: 205,
      taskDistanceKm: 205,
      taskAchievement: "100% Completed",
      handicappedDistanceKm: 205,
      handicappedSpeedKph: 80,
      launchSite: "Gransden Lodge",
      start: "GRL",
      finish: "GRL",
      turnpoints,
      heightLoss: 0,
    },
  };
}

describe("resolveTrophy", () => {
  it("uses the headline version for the current season", () => {
    const resolved = resolveTrophy(doubleCentury, 2026);
    expect(resolved.description).toContain("205.2km");
    expect(resolved.expr[0]).toEqual([
      "filter",
      "task.turnpoints",
      "<=>",
      ["BNW", "HUS"],
    ]);
  });

  it("uses the archived version for the season it applied to", () => {
    const resolved = resolveTrophy(doubleCentury, 2025);
    expect(resolved.description).toContain("205.0km");
    expect(resolved.expr[0]).toEqual([
      "filter",
      "task.turnpoints",
      "<=>",
      ["BIC", "HUS"],
    ]);
  });

  it("uses the archived version for seasons older than any entry", () => {
    const resolved = resolveTrophy(doubleCentury, 2024);
    expect(resolved.description).toContain("205.0km");
  });

  it("returns a trophy without history unchanged", () => {
    const plain: FlightTrophy = {
      id: "9",
      name: "Plain",
      description: "no history",
      expr: [["filter", "task.isCompleted"]],
    };
    expect(resolveTrophy(plain, 2026)).toBe(plain);
  });

  it("returns a ladder trophy unchanged", () => {
    const ladder: LadderTrophy = {
      id: "L1",
      type: "ladder",
      name: "Open Ladder",
      description: "ladder",
      ladderKey: "open",
      groupBy: "pilot",
      topN: 3,
    };
    expect(resolveTrophy(ladder, 2026)).toBe(ladder);
  });

  it("picks the smallest matching bound regardless of array order", () => {
    const trophy: FlightTrophy = {
      id: "7",
      name: "Twice Revised",
      description: "current",
      expr: [["filter", "task.isCompleted"]],
      history: [
        {
          untilSeason: 2025,
          description: "middle",
          expr: [["filter", "task.isCompleted", "==", "middle"]],
        },
        {
          untilSeason: 2020,
          description: "oldest",
          expr: [["filter", "task.isCompleted", "==", "oldest"]],
        },
      ],
    };
    expect(resolveTrophy(trophy, 2019).description).toBe("oldest");
    expect(resolveTrophy(trophy, 2019).expr).toEqual([
      ["filter", "task.isCompleted", "==", "oldest"],
    ]);
    expect(resolveTrophy(trophy, 2023).description).toBe("middle");
    expect(resolveTrophy(trophy, 2023).expr).toEqual([
      ["filter", "task.isCompleted", "==", "middle"],
    ]);
    expect(resolveTrophy(trophy, 2026).description).toBe("current");
  });
});

describe("resolved trophies score by season", () => {
  it("scores the BIC task in 2025 and not the BNW task", () => {
    const flights = [
      makeFlight(["BIC", "HUS"], new Date("2025-06-15")),
      makeFlight(["BNW", "HUS"], new Date("2025-06-15")),
    ];
    const trophy = resolveTrophy(doubleCentury, 2025);
    const results = trophyEval(defaultSeason, 2025, flights, trophy);
    expect(results.map((r) => r.task.turnpoints)).toEqual([["BIC", "HUS"]]);
  });

  it("scores the BNW task in 2026 and not the BIC task", () => {
    const flights = [
      makeFlight(["BIC", "HUS"], new Date("2026-06-15")),
      makeFlight(["BNW", "HUS"], new Date("2026-06-15")),
    ];
    const trophy = resolveTrophy(doubleCentury, 2026);
    const results = trophyEval(defaultSeason, 2026, flights, trophy);
    expect(results.map((r) => r.task.turnpoints)).toEqual([["BNW", "HUS"]]);
  });
});
