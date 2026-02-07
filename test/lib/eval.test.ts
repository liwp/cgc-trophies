import { ladderEval } from "../../src/lib/eval";
import type { Flight, LadderTrophy, TrophyConfig } from "../../src/types";

const defaultConfig: TrophyConfig = {
  default: "5",
  exclude: {},
  season: {
    start: { month: 1, day: 1 },
    end: { month: 12, day: 31 },
  },
};

function makeFlight(overrides: Partial<Flight> & { id: string; pilot: string }): Flight {
  return {
    date: new Date("2024-06-15"),
    glider: { type: "ASW 20", handicap: 100, registration: "G-TEST" },
    ladders: ["open"],
    task: {
      claimType: "C",
      isCompleted: true,
      crossCountryPoints: 100,
      isDeclared: true,
      scoringDistanceKm: 200,
      handicappedDistanceKm: 200,
      handicappedSpeedKph: 80,
      launchSite: "Gransden Lodge",
      start: "GRL",
      finish: "GRL",
      turnpoints: ["SHP"],
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
      makeFlight({ id: "1", pilot: "Alice", task: { ...makeFlight({ id: "", pilot: "" }).task, crossCountryPoints: 100 } }),
      makeFlight({ id: "2", pilot: "Alice", task: { ...makeFlight({ id: "", pilot: "" }).task, crossCountryPoints: 80 } }),
      makeFlight({ id: "3", pilot: "Bob", task: { ...makeFlight({ id: "", pilot: "" }).task, crossCountryPoints: 90 } }),
    ];

    const results = ladderEval(defaultConfig, 2024, flights, openTrophy);

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
        task: { ...makeFlight({ id: "", pilot: "" }).task, crossCountryPoints: (8 - i) * 10 },
      }),
    );

    const results = ladderEval(defaultConfig, 2024, flights, openTrophy);

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

    const results = ladderEval(defaultConfig, 2024, flights, openTrophy);

    expect(results).toHaveLength(1);
    expect(results[0].flights).toHaveLength(1);
    expect(results[0].flights[0].id).toBe("1");
  });

  it("filters flights outside the season", () => {
    const flights: Flight[] = [
      makeFlight({ id: "1", pilot: "Alice", date: new Date("2024-06-15") }),
      makeFlight({ id: "2", pilot: "Alice", date: new Date("2023-06-15") }),
    ];

    const results = ladderEval(defaultConfig, 2024, flights, openTrophy);

    expect(results).toHaveLength(1);
    expect(results[0].flights).toHaveLength(1);
    expect(results[0].flights[0].id).toBe("1");
  });

  it("returns empty array when no qualifying flights", () => {
    const flights: Flight[] = [
      makeFlight({ id: "1", pilot: "Alice", ladders: ["weekend"] }),
    ];

    const results = ladderEval(defaultConfig, 2024, flights, openTrophy);

    expect(results).toHaveLength(0);
  });

  it("sorts results by total score descending", () => {
    const flights: Flight[] = [
      makeFlight({ id: "1", pilot: "Alice", task: { ...makeFlight({ id: "", pilot: "" }).task, crossCountryPoints: 50 } }),
      makeFlight({ id: "2", pilot: "Bob", task: { ...makeFlight({ id: "", pilot: "" }).task, crossCountryPoints: 100 } }),
      makeFlight({ id: "3", pilot: "Charlie", task: { ...makeFlight({ id: "", pilot: "" }).task, crossCountryPoints: 75 } }),
    ];

    const results = ladderEval(defaultConfig, 2024, flights, openTrophy);

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
      minPilots: 2,
    };

    it("groups by glider registration", () => {
      const flights: Flight[] = [
        makeFlight({ id: "1", pilot: "Alice", glider: { type: "ASW 20", handicap: 100, registration: "G-ABCD" }, ladders: ["local2"] }),
        makeFlight({ id: "2", pilot: "Bob", glider: { type: "ASW 20", handicap: 100, registration: "G-ABCD" }, ladders: ["local2"] }),
      ];

      const results = ladderEval(defaultConfig, 2024, flights, syndicateTrophy);

      expect(results).toHaveLength(1);
      expect(results[0].key).toBe("G-ABCD");
      expect(results[0].pilots).toContain("Alice");
      expect(results[0].pilots).toContain("Bob");
    });

    it("filters groups with fewer than minPilots", () => {
      const flights: Flight[] = [
        makeFlight({ id: "1", pilot: "Alice", glider: { type: "ASW 20", handicap: 100, registration: "G-ABCD" }, ladders: ["local2"] }),
        makeFlight({ id: "2", pilot: "Alice", glider: { type: "ASW 20", handicap: 100, registration: "G-ABCD" }, ladders: ["local2"], task: { ...makeFlight({ id: "", pilot: "" }).task, crossCountryPoints: 80 } }),
      ];

      const results = ladderEval(defaultConfig, 2024, flights, syndicateTrophy);

      expect(results).toHaveLength(0);
    });
  });

  it("handles fewer than N flights per pilot", () => {
    const flights: Flight[] = [
      makeFlight({ id: "1", pilot: "Alice", task: { ...makeFlight({ id: "", pilot: "" }).task, crossCountryPoints: 100 } }),
    ];

    const results = ladderEval(defaultConfig, 2024, flights, openTrophy);

    expect(results).toHaveLength(1);
    expect(results[0].flights).toHaveLength(1);
    expect(results[0].totalScore).toBe(100);
  });
});
