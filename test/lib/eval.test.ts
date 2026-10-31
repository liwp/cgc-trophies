import { ladderEval, trophyEval } from "../../src/lib/eval";
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  PilotMilestones,
  SeasonConfig,
  TrophyExpr,
} from "../../src/types";
import { makeFlight } from "../helpers/flight";

const defaultSeason: SeasonConfig = {
  start: { month: 1, day: 1 },
  end: { month: 12, day: 31 },
};

describe("ladderEval", () => {
  const openTrophy: LadderTrophy = {
    id: "L1",
    type: "ladder",
    name: "Open Ladder",
    summary: "Test",
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
          crossCountryPoints: 100,
        },
      }),
      makeFlight({
        id: "2",
        pilot: "Alice",
        task: {
          crossCountryPoints: 80,
        },
      }),
      makeFlight({
        id: "3",
        pilot: "Bob",
        task: {
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
          crossCountryPoints: 50,
        },
      }),
      makeFlight({
        id: "2",
        pilot: "Bob",
        task: {
          crossCountryPoints: 100,
        },
      }),
      makeFlight({
        id: "3",
        pilot: "Charlie",
        task: {
          crossCountryPoints: 75,
        },
      }),
    ];

    const results = ladderEval(defaultSeason, 2024, flights, openTrophy);

    expect(results.map((r) => r.key)).toEqual(["Bob", "Charlie", "Alice"]);
  });

  it("drops excluded flights so the next-best flight counts", () => {
    const flights: Flight[] = [
      makeFlight({
        id: "1",
        pilot: "Alice",
        task: { crossCountryPoints: 100 },
      }),
      makeFlight({
        id: "2",
        pilot: "Alice",
        task: { crossCountryPoints: 80 },
      }),
    ];

    const results = ladderEval(
      defaultSeason,
      2024,
      flights,
      { ...openTrophy, topN: 1 },
      undefined,
      { 1: "duplicate claim" },
    );

    expect(results.map((r) => [r.key, r.totalScore])).toEqual([["Alice", 80]]);
  });

  describe("syndicate (groupBy registration)", () => {
    const syndicateTrophy: LadderTrophy = {
      id: "L5",
      type: "ladder",
      name: "Complicity Cup",
      summary: "Test",
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
      summary: "Test",
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
    summary: "Test",
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
  const speedTrophy = (expr: TrophyExpr[]): FlightTrophy => ({
    id: "T",
    name: "Test",
    summary: "Test",
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
    const flights = [
      makeFlight({
        id: "1",
        pilot: "Forward",
        task: { turnpoints: ["BNW", "HUS"] },
      }),
      makeFlight({
        id: "2",
        pilot: "Reverse",
        task: { turnpoints: ["HUS", "BNW"] },
      }),
      makeFlight({
        id: "3",
        pilot: "Other",
        task: { turnpoints: ["BNW", "SHP"] },
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
    const flights = [
      makeFlight({
        id: "1",
        pilot: "Slow",
        task: { handicappedSpeedKph: 70 },
      }),
      makeFlight({
        id: "2",
        pilot: "Fast",
        task: { handicappedSpeedKph: 95 },
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

  it("ranks flights best-first when scoring, without an explicit sort", () => {
    const flights = [70, 95, 80].map((kph) =>
      makeFlight({
        id: String(kph),
        pilot: `Pilot ${kph}`,
        task: { handicappedSpeedKph: kph },
      }),
    );

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      speedTrophy([["score", "task.handicappedSpeedKph", "kph"]]),
    );

    expect(results.map((r) => r.score.value)).toEqual([95, 80, 70]);
  });

  it("lets a later sort override the best-first ranking", () => {
    const flights = [70, 95, 80].map((kph) =>
      makeFlight({
        id: String(kph),
        pilot: `Pilot ${kph}`,
        task: { handicappedSpeedKph: kph },
      }),
    );

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      speedTrophy([
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "asc"],
      ]),
    );

    expect(results.map((r) => r.score.value)).toEqual([70, 80, 95]);
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

  it("tags flights listed in exclude with the reason", () => {
    const flights = [
      makeFlight({ id: "1", pilot: "Kept" }),
      makeFlight({ id: "2", pilot: "Excluded" }),
    ];

    const results = trophyEval(defaultSeason, 2024, flights, {
      ...speedTrophy([["filter", "task.isCompleted"]]),
      exclude: { 2: "bad trace" },
    });

    expect(results.map((r) => [r.pilot, r.exclude])).toEqual([
      ["Kept", undefined],
      ["Excluded", "bad trace"],
    ]);
  });

  it("tags excluded flights even without a filter", () => {
    const flights = [makeFlight({ id: "1", pilot: "Excluded" })];

    const results = trophyEval(defaultSeason, 2024, flights, {
      ...speedTrophy([]),
      exclude: { 1: "bad trace" },
    });

    expect(results.map((r) => r.exclude)).toEqual(["bad trace"]);
  });

  it("tags flights in the club-wide excludedFlights", () => {
    const flights = [
      makeFlight({ id: "1", pilot: "Kept" }),
      makeFlight({ id: "2", pilot: "Excluded" }),
    ];

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      speedTrophy([["filter", "task.isCompleted"]]),
      undefined,
      { 2: "duplicate claim" },
    );

    expect(results.map((r) => [r.pilot, r.exclude])).toEqual([
      ["Kept", undefined],
      ["Excluded", "duplicate claim"],
    ]);
  });

  it("does not let include override an exclusion", () => {
    const flights = [makeFlight({ id: "1", pilot: "Excluded" })];

    const results = trophyEval(
      defaultSeason,
      2024,
      flights,
      {
        ...speedTrophy([["filter", "task.isCompleted"]]),
        include: { 1: "approved" },
      },
      undefined,
      { 1: "duplicate claim" },
    );

    expect(results.map((r) => r.exclude)).toEqual(["duplicate claim"]);
  });

  it("lets flights listed in include bypass filters", () => {
    const flights = [
      makeFlight({ id: "1", pilot: "Qualifies" }),
      makeFlight({
        id: "2",
        pilot: "Included",
        task: { isCompleted: false },
      }),
      makeFlight({
        id: "3",
        pilot: "Fails",
        task: { isCompleted: false },
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
        // @ts-expect-error ">" isn't a comparator; the type rejects it too
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
        // @ts-expect-error "rank" isn't an op; the type rejects it too
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
    summary: "Test",
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

    it.each([
      // [season, last day counted, clock-change Sunday]
      [2023, "2024-03-30", "2024-03-31"], // March ends on a Sunday
      [2024, "2025-03-29", "2025-03-30"],
      [2026, "2027-03-27", "2027-03-28"],
      [2027, "2028-03-25", "2028-03-26"],
    ])(
      "ends the %i winter season the day before the clocks go forward",
      (season, lastDay, clockChange) => {
        const untilClockChange: SeasonConfig = {
          start: { month: 10, day: 1 },
          end: { month: 3, day: "lastSunday", offsetDays: -1 },
        };
        const flights = flightsOn(
          `${season}-09-30`,
          `${season}-10-01`,
          lastDay,
          clockChange,
        );

        const results = trophyEval(
          defaultSeason,
          season,
          flights,
          trophy(untilClockChange),
        );

        expect(results.map((r) => r.id).sort()).toEqual([
          `${season}-10-01`,
          lastDay,
        ]);
      },
    );

    it("supports a season starting on a last Sunday", () => {
      const season: SeasonConfig = {
        start: { month: 10, day: "lastSunday" },
        end: { month: 12, day: 31 },
      };
      const flights = flightsOn("2026-10-24", "2026-10-25");

      const results = trophyEval(defaultSeason, 2026, flights, trophy(season));

      expect(results.map((r) => r.id)).toEqual(["2026-10-25"]);
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
        summary: "Test",
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
