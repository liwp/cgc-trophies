import { ladderEval, trophyEval } from "../../src/lib/eval";
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  PilotMilestones,
  SeasonConfig,
} from "../../src/types";

const defaultSeason: SeasonConfig = {
  start: { month: 1, day: 1 },
  end: { month: 12, day: 31 },
};

function makeFlight(
  overrides: Partial<Flight> & { id: string; pilot: string },
): Flight {
  return {
    date: new Date("2024-06-15"),
    clubName: "Cambridge Gliding Centre",
    glider: { type: "ASW 20", handicap: 100, registration: "G-TEST" },
    ladders: ["open"],
    task: {
      claimType: "C",
      isCompleted: true,
      crossCountryPoints: 100,
      isDeclared: true,
      scoringDistanceKm: 200,
      taskDistanceKm: 200,
      taskAchievement: "Declared/Completed",
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

describe("ladderEval", () => {
  const openTrophy: LadderTrophy = {
    id: "L1",
    type: "ladder",
    name: "Open Ladder",
    description: "Test open ladder",
    ladderKey: "open",
    groupBy: "pilot",
    topN: 6,
  };

  it("groups flights by pilot and sums top N scores", () => {
    const flights: Flight[] = [
      makeFlight({
        id: "1",
        pilot: "Alice",
        task: {
          ...makeFlight({ id: "", pilot: "" }).task,
          crossCountryPoints: 100,
        },
      }),
      makeFlight({
        id: "2",
        pilot: "Alice",
        task: {
          ...makeFlight({ id: "", pilot: "" }).task,
          crossCountryPoints: 80,
        },
      }),
      makeFlight({
        id: "3",
        pilot: "Bob",
        task: {
          ...makeFlight({ id: "", pilot: "" }).task,
          crossCountryPoints: 90,
        },
      }),
    ];

    const results = ladderEval(defaultSeason, 2024, flights, openTrophy);

    expect(results).toHaveLength(2);
    expect(results[0].key).toBe("Alice");
    expect(results[0].totalScore).toBe(180);
    expect(results[0].flights).toHaveLength(2);
    expect(results[1].key).toBe("Bob");
    expect(results[1].totalScore).toBe(90);
  });

  it("takes only top N flights per pilot", () => {
    const flights: Flight[] = Array.from({ length: 8 }, (_, i) =>
      makeFlight({
        id: String(i + 1),
        pilot: "Alice",
        task: {
          ...makeFlight({ id: "", pilot: "" }).task,
          crossCountryPoints: (8 - i) * 10,
        },
      }),
    );

    const results = ladderEval(defaultSeason, 2024, flights, openTrophy);

    expect(results).toHaveLength(1);
    expect(results[0].flights).toHaveLength(6);
    // Top 6: 80+70+60+50+40+30 = 330
    expect(results[0].totalScore).toBe(330);
  });

  it("filters flights not on the correct ladder", () => {
    const flights: Flight[] = [
      makeFlight({ id: "1", pilot: "Alice", ladders: ["open"] }),
      makeFlight({ id: "2", pilot: "Alice", ladders: ["weekend"] }),
    ];

    const results = ladderEval(defaultSeason, 2024, flights, openTrophy);

    expect(results).toHaveLength(1);
    expect(results[0].flights).toHaveLength(1);
    expect(results[0].flights[0].id).toBe("1");
  });

  it("filters flights outside the season", () => {
    const flights: Flight[] = [
      makeFlight({ id: "1", pilot: "Alice", date: new Date("2024-06-15") }),
      makeFlight({ id: "2", pilot: "Alice", date: new Date("2023-06-15") }),
    ];

    const results = ladderEval(defaultSeason, 2024, flights, openTrophy);

    expect(results).toHaveLength(1);
    expect(results[0].flights).toHaveLength(1);
    expect(results[0].flights[0].id).toBe("1");
  });

  it("returns empty array when no qualifying flights", () => {
    const flights: Flight[] = [
      makeFlight({ id: "1", pilot: "Alice", ladders: ["weekend"] }),
    ];

    const results = ladderEval(defaultSeason, 2024, flights, openTrophy);

    expect(results).toHaveLength(0);
  });

  it("sorts results by total score descending", () => {
    const flights: Flight[] = [
      makeFlight({
        id: "1",
        pilot: "Alice",
        task: {
          ...makeFlight({ id: "", pilot: "" }).task,
          crossCountryPoints: 50,
        },
      }),
      makeFlight({
        id: "2",
        pilot: "Bob",
        task: {
          ...makeFlight({ id: "", pilot: "" }).task,
          crossCountryPoints: 100,
        },
      }),
      makeFlight({
        id: "3",
        pilot: "Charlie",
        task: {
          ...makeFlight({ id: "", pilot: "" }).task,
          crossCountryPoints: 75,
        },
      }),
    ];

    const results = ladderEval(defaultSeason, 2024, flights, openTrophy);

    expect(results.map((r) => r.key)).toEqual(["Bob", "Charlie", "Alice"]);
  });

  describe("syndicate (groupBy registration)", () => {
    const syndicateTrophy: LadderTrophy = {
      id: "L5",
      type: "ladder",
      name: "Complicity Cup",
      description: "Syndicate ladder",
      ladderKey: "local2",
      groupBy: "registration",
      topN: 6,
    };

    it("groups by glider registration", () => {
      const flights: Flight[] = [
        makeFlight({
          id: "1",
          pilot: "Alice",
          glider: { type: "ASW 20", handicap: 100, registration: "G-ABCD" },
          ladders: ["local2"],
        }),
        makeFlight({
          id: "2",
          pilot: "Bob",
          glider: { type: "ASW 20", handicap: 100, registration: "G-ABCD" },
          ladders: ["local2"],
        }),
      ];

      const results = ladderEval(defaultSeason, 2024, flights, syndicateTrophy);

      expect(results).toHaveLength(1);
      expect(results[0].key).toBe("G-ABCD");
      expect(results[0].pilots).toContain("Alice");
      expect(results[0].pilots).toContain("Bob");
    });

    it("swaps in flights from other pilots to meet minPilots", () => {
      const flights: Flight[] = [
        // Pilot A has 7 flights, all better than B's
        ...Array.from({ length: 7 }, (_, i) =>
          makeFlight({
            id: `a${i}`,
            pilot: "Alice",
            glider: { type: "ASW 20", handicap: 100, registration: "G-ABCD" },
            ladders: ["local2"],
            task: {
              ...makeFlight({ id: "", pilot: "" }).task,
              crossCountryPoints: 100 - i * 10,
            },
          }),
        ),
        // Pilot B has 1 flight, worse than all of A's
        makeFlight({
          id: "b0",
          pilot: "Bob",
          glider: { type: "ASW 20", handicap: 100, registration: "G-ABCD" },
          ladders: ["local2"],
          task: {
            ...makeFlight({ id: "", pilot: "" }).task,
            crossCountryPoints: 5,
          },
        }),
      ];

      const results = ladderEval(defaultSeason, 2024, flights, syndicateTrophy);

      // Should include this group — not filter it out
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe("G-ABCD");
      // Top 5 from Alice + best from Bob = 100+90+80+70+60+5 = 405
      expect(results[0].totalScore).toBe(405);
      expect(results[0].pilots).toContain("Alice");
      expect(results[0].pilots).toContain("Bob");
      expect(results[0].flights).toHaveLength(6);
    });

    it("filters groups with fewer than minPilots", () => {
      const flights: Flight[] = [
        makeFlight({
          id: "1",
          pilot: "Alice",
          glider: { type: "ASW 20", handicap: 100, registration: "G-ABCD" },
          ladders: ["local2"],
        }),
        makeFlight({
          id: "2",
          pilot: "Alice",
          glider: { type: "ASW 20", handicap: 100, registration: "G-ABCD" },
          ladders: ["local2"],
          task: {
            ...makeFlight({ id: "", pilot: "" }).task,
            crossCountryPoints: 80,
          },
        }),
      ];

      const results = ladderEval(defaultSeason, 2024, flights, syndicateTrophy);

      expect(results).toHaveLength(0);
    });
  });

  it("handles fewer than N flights per pilot", () => {
    const flights: Flight[] = [
      makeFlight({
        id: "1",
        pilot: "Alice",
        task: {
          ...makeFlight({ id: "", pilot: "" }).task,
          crossCountryPoints: 100,
        },
      }),
    ];

    const results = ladderEval(defaultSeason, 2024, flights, openTrophy);

    expect(results).toHaveLength(1);
    expect(results[0].flights).toHaveLength(1);
    expect(results[0].totalScore).toBe(100);
  });

  describe("gliderFilter", () => {
    const bollyTrophy: LadderTrophy = {
      id: "L6",
      type: "ladder",
      name: "Bolly Challenge",
      description: "Test bolly",
      ladderKey: "open",
      groupBy: "pilot",
      topN: 6,
      gliderFilter: ["asw\\s*19", "pegase"],
    };

    it("includes flights matching gliderFilter", () => {
      const flights: Flight[] = [
        makeFlight({
          id: "1",
          pilot: "Alice",
          glider: { type: "ASW 19", handicap: 90, registration: "G-ASWN" },
        }),
        makeFlight({
          id: "2",
          pilot: "Bob",
          glider: { type: "Pegase", handicap: 86, registration: "G-PEGS" },
        }),
      ];

      const results = ladderEval(defaultSeason, 2024, flights, bollyTrophy);

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.key)).toEqual(
        expect.arrayContaining(["Alice", "Bob"]),
      );
    });

    it("excludes flights not matching gliderFilter", () => {
      const flights: Flight[] = [
        makeFlight({
          id: "1",
          pilot: "Alice",
          glider: { type: "ASW19", handicap: 90, registration: "G-ASWN" },
        }),
        makeFlight({
          id: "2",
          pilot: "Bob",
          glider: { type: "LS8", handicap: 104, registration: "G-LSEI" },
        }),
      ];

      const results = ladderEval(defaultSeason, 2024, flights, bollyTrophy);

      expect(results).toHaveLength(1);
      expect(results[0].key).toBe("Alice");
    });

    it("passes all flights when no gliderFilter is set", () => {
      const flights: Flight[] = [
        makeFlight({
          id: "1",
          pilot: "Alice",
          glider: { type: "LS8", handicap: 104, registration: "G-LSEI" },
        }),
      ];

      const results = ladderEval(defaultSeason, 2024, flights, openTrophy);

      expect(results).toHaveLength(1);
    });

    it("matches case-insensitively", () => {
      const flights: Flight[] = [
        makeFlight({
          id: "1",
          pilot: "Alice",
          glider: { type: "asw 19", handicap: 90, registration: "G-ASWN" },
        }),
        makeFlight({
          id: "2",
          pilot: "Bob",
          glider: { type: "PEGASE", handicap: 86, registration: "G-PEGS" },
        }),
      ];

      const results = ladderEval(defaultSeason, 2024, flights, bollyTrophy);

      expect(results).toHaveLength(2);
    });
  });

  describe("milestone exclusions", () => {
    const milestones: PilotMilestones = {
      "300km": { Alice: 2022 },
    };

    const trophyWithMilestone: LadderTrophy = {
      ...openTrophy,
      excludePilotsWithMilestone: "300km",
    };

    it("excludes pilots who achieved milestone before season", () => {
      const flights: Flight[] = [
        makeFlight({ id: "1", pilot: "Alice" }),
        makeFlight({ id: "2", pilot: "Bob" }),
      ];

      const results = ladderEval(
        defaultSeason,
        2024,
        flights,
        trophyWithMilestone,
        milestones,
      );

      expect(results).toHaveLength(1);
      expect(results[0].key).toBe("Bob");
    });

    it("sentinel 0 always excludes", () => {
      const ms: PilotMilestones = { "300km": { Alice: 0 } };
      const flights: Flight[] = [
        makeFlight({ id: "1", pilot: "Alice" }),
        makeFlight({ id: "2", pilot: "Bob" }),
      ];

      const results = ladderEval(
        defaultSeason,
        2024,
        flights,
        trophyWithMilestone,
        ms,
      );

      expect(results).toHaveLength(1);
      expect(results[0].key).toBe("Bob");
    });
  });
});

describe("trophyEval milestone exclusions", () => {
  const boomerangTrophy: FlightTrophy = {
    id: "3",
    name: "The Boomerang",
    description: "Test",
    expr: [
      ["filter", "task.launchSite", "=", "Gransden Lodge"],
      ["filter", "task.isCompleted"],
      ["filter", "task.turnpoints", "<=>", ["SHP"]],
      ["score", "task.handicappedSpeedKph", "kph"],
      ["sort", "score.value", "desc"],
    ],
    excludePilotsWithMilestone: "500km",
  };

  const milestones: PilotMilestones = {
    "500km": { Alice: 2022 },
  };

  it("excludes pilot flights via milestone", () => {
    const flights: Flight[] = [
      makeFlight({ id: "1", pilot: "Alice" }),
      makeFlight({ id: "2", pilot: "Bob" }),
    ];

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      boomerangTrophy,
      milestones,
    );

    const nonExcluded = results.filter((r) => !r.exclude);
    expect(nonExcluded).toHaveLength(1);
    expect(nonExcluded[0].pilot).toBe("Bob");
  });

  it("sentinel 0 always excludes", () => {
    const ms: PilotMilestones = { "500km": { Alice: 0 } };
    const flights: Flight[] = [
      makeFlight({ id: "1", pilot: "Alice" }),
      makeFlight({ id: "2", pilot: "Bob" }),
    ];

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      boomerangTrophy,
      ms,
    );

    const nonExcluded = results.filter((r) => !r.exclude);
    expect(nonExcluded).toHaveLength(1);
    expect(nonExcluded[0].pilot).toBe("Bob");
  });

  it("milestone year = season means NOT excluded", () => {
    const ms: PilotMilestones = { "500km": { Alice: 2024 } };
    const flights: Flight[] = [makeFlight({ id: "1", pilot: "Alice" })];

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      boomerangTrophy,
      ms,
    );

    expect(results.filter((r) => !r.exclude)).toHaveLength(1);
  });

  it("no milestone on trophy means no exclusions", () => {
    const trophyNoMilestone: FlightTrophy = {
      ...boomerangTrophy,
      excludePilotsWithMilestone: undefined,
    };
    const flights: Flight[] = [makeFlight({ id: "1", pilot: "Alice" })];

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      trophyNoMilestone,
      milestones,
    );

    expect(results.filter((r) => !r.exclude)).toHaveLength(1);
  });
});

describe("trophyEval DSL", () => {
  // Dates are mid-month so these tests don't depend on season-boundary handling.
  const speedTrophy = (expr: any[][]): FlightTrophy => ({
    id: "T",
    name: "Test",
    description: "Test",
    expr,
  });

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters with '<=' against a field value", () => {
    const flights = [
      makeFlight({
        id: "1",
        pilot: "Low",
        glider: { type: "K-21", handicap: 92, registration: "G-A" },
      }),
      makeFlight({
        id: "2",
        pilot: "Edge",
        glider: { type: "LS8", handicap: 95, registration: "G-B" },
      }),
      makeFlight({
        id: "3",
        pilot: "High",
        glider: { type: "ASG 29", handicap: 121, registration: "G-C" },
      }),
    ];

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      speedTrophy([["filter", "glider.handicap", "<=", 95]]),
    );

    expect(results.map((r) => r.pilot)).toEqual(["Low", "Edge"]);
  });

  it("matches '<=>' turnpoint sequences in either direction", () => {
    const task = makeFlight({ id: "", pilot: "" }).task;
    const flights = [
      makeFlight({
        id: "1",
        pilot: "Forward",
        task: { ...task, turnpoints: ["BNW", "HUS"] },
      }),
      makeFlight({
        id: "2",
        pilot: "Reverse",
        task: { ...task, turnpoints: ["HUS", "BNW"] },
      }),
      makeFlight({
        id: "3",
        pilot: "Other",
        task: { ...task, turnpoints: ["BNW", "SHP"] },
      }),
    ];

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      speedTrophy([["filter", "task.turnpoints", "<=>", ["BNW", "HUS"]]]),
    );

    expect(results.map((r) => r.pilot)).toEqual(["Forward", "Reverse"]);
  });

  it("scores a field and sorts by score descending", () => {
    const task = makeFlight({ id: "", pilot: "" }).task;
    const flights = [
      makeFlight({
        id: "1",
        pilot: "Slow",
        task: { ...task, handicappedSpeedKph: 70 },
      }),
      makeFlight({
        id: "2",
        pilot: "Fast",
        task: { ...task, handicappedSpeedKph: 95 },
      }),
    ];

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      speedTrophy([
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ]),
    );

    expect(results.map((r) => [r.pilot, r.score])).toEqual([
      ["Fast", { value: 95, unit: "kph" }],
      ["Slow", { value: 70, unit: "kph" }],
    ]);
  });

  it("applies a cross-year season (start month after end month)", () => {
    const winter: SeasonConfig = {
      start: { month: 10, day: 1 },
      end: { month: 3, day: 31 },
    };
    const flights = [
      makeFlight({ id: "1", pilot: "Nov", date: new Date("2024-11-15") }),
      makeFlight({ id: "2", pilot: "Feb", date: new Date("2025-02-15") }),
      makeFlight({ id: "3", pilot: "Summer", date: new Date("2024-06-15") }),
      makeFlight({
        id: "4",
        pilot: "NextWinter",
        date: new Date("2025-11-15"),
      }),
      makeFlight({
        id: "5",
        pilot: "PrevWinter",
        date: new Date("2024-02-15"),
      }),
    ];

    const results = trophyEval(defaultSeason, 2024, flights, {
      ...speedTrophy([["filter", "task.isCompleted"]]),
      season: winter,
    });

    expect(results.map((r) => r.pilot).sort()).toEqual(["Feb", "Nov"]);
  });

  it("removes flights listed in exclude", () => {
    const flights = [
      makeFlight({ id: "1", pilot: "Kept" }),
      makeFlight({ id: "2", pilot: "Excluded" }),
    ];

    const results = trophyEval(defaultSeason, 2024, flights, {
      ...speedTrophy([["filter", "task.isCompleted"]]),
      exclude: { 2: "bad trace" },
    });

    expect(results.map((r) => r.pilot)).toEqual(["Kept"]);
  });

  it("lets flights listed in include bypass filters", () => {
    const task = makeFlight({ id: "", pilot: "" }).task;
    const flights = [
      makeFlight({ id: "1", pilot: "Qualifies" }),
      makeFlight({
        id: "2",
        pilot: "Included",
        task: { ...task, isCompleted: false },
      }),
      makeFlight({
        id: "3",
        pilot: "Fails",
        task: { ...task, isCompleted: false },
      }),
    ];

    const results = trophyEval(defaultSeason, 2024, flights, {
      ...speedTrophy([["filter", "task.isCompleted"]]),
      include: { 2: "landed out after finishing, approved by committee" },
    });

    expect(results.map((r) => [r.pilot, r.include])).toEqual([
      ["Qualifies", undefined],
      ["Included", "landed out after finishing, approved by committee"],
    ]);
  });

  it("throws on an unknown filter predicate", () => {
    expect(() =>
      trophyEval(
        defaultSeason,
        2024,
        [makeFlight({ id: "1", pilot: "A" })],
        speedTrophy([["filter", "glider.handicap", ">", 95]]),
      ),
    ).toThrow("Unknown filter predicate: >");
  });

  it("throws on an unknown op", () => {
    expect(() =>
      trophyEval(
        defaultSeason,
        2024,
        [makeFlight({ id: "1", pilot: "A" })],
        speedTrophy([["rank", "score.value"]]),
      ),
    ).toThrow("Unknown op: rank");
  });
});

describe("season boundaries", () => {
  // Flight dates come from the CSV as UTC midnight. Season start and end days
  // are inclusive, whatever timezone the code runs in.
  const TIMEZONES = [
    "UTC",
    "Europe/London",
    "America/Los_Angeles",
    "Asia/Tokyo",
  ];
  const winter: SeasonConfig = {
    start: { month: 10, day: 1 },
    end: { month: 3, day: 31 },
  };
  const trophy = (season?: SeasonConfig): FlightTrophy => ({
    id: "T",
    name: "Test",
    description: "Test",
    expr: [["filter", "task.isCompleted"]],
    season,
  });
  const flightsOn = (...dates: string[]) =>
    dates.map((date) =>
      makeFlight({ id: date, pilot: date, date: new Date(date) }),
    );

  let originalTz: string | undefined;
  beforeEach(() => {
    originalTz = process.env.TZ;
  });
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  describe.each(TIMEZONES)("in %s", (tz) => {
    beforeEach(() => {
      process.env.TZ = tz;
    });

    it("includes the first and last day of a calendar season", () => {
      const flights = flightsOn(
        "2023-12-31",
        "2024-01-01",
        "2024-12-31",
        "2025-01-01",
      );

      const results = trophyEval(defaultSeason, 2024, flights, trophy());

      expect(results.map((r) => r.id)).toEqual(["2024-01-01", "2024-12-31"]);
    });

    it("includes the first and last day of a cross-year season", () => {
      const flights = flightsOn(
        "2024-09-30",
        "2024-10-01",
        "2025-03-31",
        "2025-04-01",
      );

      const results = trophyEval(defaultSeason, 2024, flights, trophy(winter));

      expect(results.map((r) => r.id)).toEqual(["2024-10-01", "2025-03-31"]);
    });

    it("applies the same boundaries to ladders", () => {
      const ladder: LadderTrophy = {
        id: "L",
        type: "ladder",
        name: "Ladder",
        description: "Test",
        ladderKey: "open",
        groupBy: "pilot",
        topN: 6,
      };
      const flights = flightsOn(
        "2023-12-31",
        "2024-01-01",
        "2024-12-31",
        "2025-01-01",
      );

      const results = ladderEval(defaultSeason, 2024, flights, ladder);

      expect(results.map((r) => r.key).sort()).toEqual([
        "2024-01-01",
        "2024-12-31",
      ]);
    });
  });
});
