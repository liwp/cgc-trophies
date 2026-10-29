import {
  bestDays,
  calculateStats,
  categories,
  clubGliderStats,
  monthlyActivity,
  pilotStats,
  pilotStatsCopyData,
  seasonSummary,
  superlatives,
  taskBreakdown,
  topTasks,
  updateCategory,
  updateStats,
} from "../../src/lib/stats";
import type { Flight } from "../../src/types";
import { makeFlight as baseFlight } from "../helpers/flight";

const makeFlight = (task: Partial<Flight["task"]> = {}): Flight =>
  baseFlight({
    date: new Date("2025-07-01"),
    pilot: "Doe, Jane",
    glider: { type: "Discus" },
    task: {
      scoringDistanceKm: 350,
      taskDistanceKm: 350,
      handicappedDistanceKm: 350,
      handicappedSpeedKph: 70,
      turnpoints: [],
      ...task,
    },
  });

const category = (key: string) => categories.find((c) => c.key === key)!;

describe("stats", () => {
  describe("category predicates", () => {
    it("open matches everything", () => {
      expect(category("open").pred(makeFlight({ taskDistanceKm: 0 }))).toBe(
        true,
      );
    });

    it.each([
      ["300km", 299, false],
      ["300km", 300, true],
      ["300km", 399, true],
      ["300km", 400, false],
      ["400km", 399, false],
      ["400km", 400, true],
      ["400km", 499, true],
      ["400km", 500, false],
      ["under300km", 299, true],
      ["under300km", 300, false],
      ["500km", 499, false],
      ["500km", 500, true],
      ["500km", 599, true],
      ["500km", 600, false],
      ["600km", 599, false],
      ["600km", 600, true],
      ["600km", 749, true],
      ["600km", 750, false],
      ["750km", 749, false],
      ["750km", 750, true],
      ["750km", 2000, true],
    ])(
      "%s boundary at %dkm -> %s",
      (key: string, km: number, expected: boolean) => {
        expect(category(key).pred(makeFlight({ taskDistanceKm: km }))).toBe(
          expected,
        );
      },
    );
  });

  describe("updateCategory", () => {
    it("initialises from undefined and counts a completed+declared flight", () => {
      expect(updateCategory(undefined, makeFlight())).toEqual({
        completed: 1,
        total: 1,
        percentage: 100,
      });
    });

    it("increments total but not completed when not completed/declared", () => {
      const prev = { completed: 1, total: 1, percentage: 100 };
      expect(updateCategory(prev, makeFlight({ isCompleted: false }))).toEqual({
        completed: 1,
        total: 2,
        percentage: 50,
      });
    });

    it("requires both completed and declared to count as completed", () => {
      expect(
        updateCategory(undefined, makeFlight({ isDeclared: false })),
      ).toEqual({ completed: 0, total: 1, percentage: 0 });
    });

    it("defaults missing task flags to false", () => {
      const flight = makeFlight();
      // Deliberately drop the flags to hit the defaults.
      flight.task = {
        ...flight.task,
        isCompleted: undefined,
        isDeclared: undefined,
      } as unknown as Flight["task"];
      expect(updateCategory(undefined, flight)).toEqual({
        completed: 0,
        total: 1,
        percentage: 0,
      });
    });
  });

  describe("updateStats", () => {
    it("ignores flights that are not claim type C", () => {
      const prev = {};
      expect(updateStats(prev, makeFlight({ claimType: "A" }))).toBe(prev);
    });

    it("buckets a completed 350km flight into open and 300km", () => {
      const stats = updateStats({}, makeFlight({ taskDistanceKm: 350 }));
      expect(Object.keys(stats).sort()).toEqual(["300km", "open"]);
      expect(stats.open).toEqual({ completed: 1, total: 1, percentage: 100 });
      expect(stats["300km"]).toEqual({
        completed: 1,
        total: 1,
        percentage: 100,
      });
    });
  });

  describe("calculateStats", () => {
    it("aggregates categories across multiple flights", () => {
      const stats = calculateStats([
        makeFlight({ taskDistanceKm: 350 }),
        makeFlight({ taskDistanceKm: 450, isCompleted: false }),
        makeFlight({ claimType: "A", taskDistanceKm: 500 }),
      ]);
      // Two C-type flights counted on the open ladder, one completed.
      expect(stats.open).toEqual({ completed: 1, total: 2, percentage: 50 });
      expect(stats["300km"].total).toBe(1);
      expect(stats["400km"].total).toBe(1);
      expect(stats["500km"]).toBeUndefined();
    });
  });
});

describe("seasonSummary", () => {
  const calendar = {
    start: { month: 1, day: 1 },
    end: { month: 12, day: 31 },
  };
  const flight = (overrides: Parameters<typeof baseFlight>[0] = {}) =>
    baseFlight({ date: new Date("2025-06-01"), ...overrides });

  it("totals the season's claimed flights", () => {
    const summary = seasonSummary(
      [
        flight({
          pilot: "A",
          glider: { registration: "G-AAAA" },
          task: { scoringDistanceKm: 300, crossCountryPoints: 3000 },
        }),
        flight({
          pilot: "A",
          glider: { registration: "G-BBBB" },
          task: {
            scoringDistanceKm: 100.5,
            crossCountryPoints: 500,
            isCompleted: false,
          },
        }),
        flight({
          pilot: "B",
          glider: { registration: "G-AAAA" },
          task: {
            scoringDistanceKm: 50,
            crossCountryPoints: 100,
            isDeclared: false,
          },
        }),
      ],
      2025,
      calendar,
    );
    expect(summary).toEqual({
      flights: 3,
      pilots: 2,
      gliders: 2,
      scoringKm: 450.5,
      points: 3600,
      completed: 1,
      declaredPct: (100 * 2) / 3,
    });
  });

  it("ignores unclaimed and out-of-season flights", () => {
    const summary = seasonSummary(
      [
        flight({ task: { claimType: "P" } }),
        flight({ date: new Date("2024-12-31") }),
        flight({ date: new Date("2026-01-01") }),
      ],
      2025,
      calendar,
    );
    expect(summary.flights).toBe(0);
    expect(summary.declaredPct).toBe(0);
  });

  it("uses the configured season boundaries", () => {
    const winter = {
      start: { month: 10, day: 1 },
      end: { month: 3, day: 31 },
    };
    const summary = seasonSummary(
      [flight({ date: new Date("2026-02-01") })],
      2025,
      winter,
    );
    expect(summary.flights).toBe(1);
  });
});

describe("pilotStats", () => {
  const calendar = {
    start: { month: 1, day: 1 },
    end: { month: 12, day: 31 },
  };
  const flight = (overrides: Parameters<typeof baseFlight>[0] = {}) =>
    baseFlight({ date: new Date("2025-06-01"), ...overrides });

  it("totals each pilot's season, most points first", () => {
    const [jane, joe] = pilotStats(
      [
        flight({
          pilot: "Doe, Joe",
          task: { crossCountryPoints: 100, isCompleted: false },
        }),
        flight({
          pilot: "Doe, Jane",
          date: new Date("2025-07-01"),
          glider: { registration: "G-BBBB" },
          task: {
            scoringDistanceKm: 510,
            taskDistanceKm: 510,
            crossCountryPoints: 5000,
            handicappedSpeedKph: 90,
          },
        }),
        flight({
          pilot: "Doe, Jane",
          date: new Date("2025-05-01"),
          glider: { registration: "G-AAAA" },
          task: {
            scoringDistanceKm: 300,
            taskDistanceKm: 300,
            crossCountryPoints: 3000,
            handicappedSpeedKph: 70,
          },
        }),
        flight({
          pilot: "Doe, Jane",
          glider: { registration: "G-AAAA" },
          task: {
            scoringDistanceKm: 120,
            taskDistanceKm: 400,
            crossCountryPoints: 600,
            handicappedSpeedKph: 0,
            isCompleted: false,
          },
        }),
      ],
      2025,
      calendar,
    );
    expect(jane).toEqual({
      pilot: "Doe, Jane",
      flights: 3,
      scoringKm: 930,
      points: 8600,
      bestKm: 510,
      bestPoints: 5000,
      completed: 2,
      completionPct: (100 * 2) / 3,
      avgSpeedKph: 80,
      completed300: 2,
      completed500: 1,
      gliders: ["G-AAAA", "G-BBBB"],
    });
    expect(joe).toMatchObject({
      pilot: "Doe, Joe",
      completed: 0,
      avgSpeedKph: null,
    });
  });

  it("only counts the season's claimed flights", () => {
    expect(
      pilotStats(
        [
          flight({ task: { claimType: "P" } }),
          flight({ date: new Date("2024-06-01") }),
        ],
        2025,
        calendar,
      ),
    ).toEqual([]);
  });

  it("breaks points ties by name", () => {
    const stats = pilotStats(
      [flight({ pilot: "B" }), flight({ pilot: "A" })],
      2025,
      calendar,
    );
    expect(stats.map((s) => s.pilot)).toEqual(["A", "B"]);
  });
});

describe("pilotStatsCopyData", () => {
  it("formats a header and a row per pilot", () => {
    const [header, row] = pilotStatsCopyData([
      {
        pilot: "Doe, Jane",
        flights: 3,
        scoringKm: 1234.56,
        points: 8600,
        bestKm: 510.04,
        bestPoints: 5000,
        completed: 2,
        completionPct: 66.67,
        avgSpeedKph: null,
        completed300: 2,
        completed500: 1,
        gliders: ["G-AAAA", "G-BBBB"],
      },
    ]);
    expect(header[0]).toBe("Pilot");
    expect(row).toEqual([
      "Jane Doe",
      "3",
      "1,235",
      "8,600",
      "510.0",
      "5,000",
      "67%",
      "",
      "2",
      "1",
      "G-AAAA, G-BBBB",
    ]);
  });
});

describe("monthlyActivity", () => {
  const flight = (date: string, km = 100, claimType = "C") =>
    baseFlight({
      date: new Date(date),
      task: { scoringDistanceKm: km, claimType },
    });

  it("totals each month of a calendar season, including empty ones", () => {
    const months = monthlyActivity(
      [
        flight("2025-04-30", 300),
        flight("2025-04-01", 50.5),
        flight("2025-06-15"),
        flight("2025-06-16", 100, "P"),
        flight("2026-01-01"),
      ],
      2025,
      { start: { month: 1, day: 1 }, end: { month: 12, day: 31 } },
    );
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({
      year: 2025,
      month: 1,
      flights: 0,
      scoringKm: 0,
    });
    expect(months[3]).toEqual({
      year: 2025,
      month: 4,
      flights: 2,
      scoringKm: 350.5,
    });
    expect(months[5].flights).toBe(1);
  });

  it("runs into the next year for a winter season", () => {
    const months = monthlyActivity([flight("2026-02-10")], 2025, {
      start: { month: 10, day: 1 },
      end: { month: 3, day: 31 },
    });
    expect(months.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-1",
      "2026-2",
      "2026-3",
    ]);
    expect(months[4].flights).toBe(1);
  });
});

describe("bestDays", () => {
  const calendar = {
    start: { month: 1, day: 1 },
    end: { month: 12, day: 31 },
  };
  const flight = (date: string, km: number, pilot = "A", claimType = "C") =>
    baseFlight({
      date: new Date(date),
      pilot,
      task: { scoringDistanceKm: km, claimType },
    });

  it("ranks days by total km, with their flights longest first", () => {
    const days = bestDays(
      [
        flight("2025-05-01", 300, "A"),
        flight("2025-05-01", 500, "B"),
        flight("2025-06-01", 100),
        flight("2025-06-01", 100),
        flight("2025-06-01", 100),
        flight("2025-07-01", 900, "C", "P"),
        flight("2024-07-01", 900),
      ],
      2025,
      calendar,
    );
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({
      date: new Date("2025-05-01"),
      scoringKm: 800,
    });
    expect(days[0].flights.map((f) => f.pilot)).toEqual(["B", "A"]);
    expect(days[1].flights).toHaveLength(3);
    expect(days[1].scoringKm).toBe(300);
  });

  it("breaks ties by flights, then the earlier day, and keeps the top N", () => {
    const days = bestDays(
      [
        flight("2025-06-02", 200),
        flight("2025-06-01", 200),
        flight("2025-06-03", 100),
        flight("2025-06-03", 100),
      ],
      2025,
      calendar,
      2,
    );
    expect(days.map((d) => d.date.toISOString().slice(0, 10))).toEqual([
      "2025-06-03",
      "2025-06-01",
    ]);
  });
});

describe("taskBreakdown", () => {
  const calendar = {
    start: { month: 1, day: 1 },
    end: { month: 12, day: 31 },
  };
  const flight = (task: Partial<Flight["task"]>, date = "2025-06-01") =>
    baseFlight({ date: new Date(date), task });

  it("counts completed and attempted tasks per band and shape", () => {
    const { bands, shapes } = taskBreakdown(
      [
        flight({
          taskDistanceKm: 320,
          taskShape: "triangle",
          isFaiTriangle: true,
        }),
        flight({
          taskDistanceKm: 350,
          taskShape: "triangle",
          isCompleted: false,
        }),
        flight({ taskDistanceKm: 510, taskShape: "out-and-return" }),
        flight({ taskDistanceKm: 100, taskShape: "other", claimType: "P" }),
        flight({ taskDistanceKm: 100, taskShape: "other" }, "2024-06-01"),
      ],
      2025,
      calendar,
    );
    expect(bands.open).toEqual({ completed: 2, total: 3 });
    expect(bands["300km"]).toEqual({ completed: 1, total: 2 });
    expect(bands["400km"]).toEqual({ completed: 0, total: 0 });
    expect(bands["500km"]).toEqual({ completed: 1, total: 1 });
    expect(shapes).toEqual({
      "fai-triangle": { completed: 1, total: 1 },
      triangle: { completed: 0, total: 1 },
      "out-and-return": { completed: 1, total: 1 },
      other: { completed: 0, total: 0 },
    });
  });
});

describe("topTasks", () => {
  const calendar = {
    start: { month: 1, day: 1 },
    end: { month: 12, day: 31 },
  };
  const flight = (turnpoints: string[], task: Partial<Flight["task"]> = {}) =>
    baseFlight({
      date: new Date("2025-06-01"),
      task: { start: "GRL", finish: "GRL", turnpoints, ...task },
    });

  it("counts a task and its reverse as one, shown the usual way round", () => {
    const tasks = topTasks(
      [
        flight(["RUS", "RAM"], {
          taskDistanceKm: 301,
          handicappedSpeedKph: 80,
        }),
        flight(["RAM", "RUS"], {
          taskDistanceKm: 300,
          handicappedSpeedKph: 70,
        }),
        flight(["RAM", "RUS"], {
          isCompleted: false,
          taskDistanceKm: 300,
          handicappedSpeedKph: 0,
        }),
        flight(["GRM"]),
      ],
      2025,
      calendar,
    );
    expect(tasks).toEqual([
      {
        route: ["GRL", "RAM", "RUS", "GRL"],
        taskDistanceKm: 300,
        completed: 2,
        total: 3,
        avgSpeedKph: 75,
        flights: expect.any(Array),
      },
      expect.objectContaining({ route: ["GRL", "GRM", "GRL"], total: 1 }),
    ]);
    expect(tasks[0].flights.map((f) => f.task.handicappedSpeedKph)).toEqual([
      80, 70, 0,
    ]);
  });

  it("leaves out tasks with user-defined points and keeps the top N", () => {
    const tasks = topTasks(
      [
        flight(["*TP1"]),
        flight(["GRM"], { finish: "*TP5" }),
        flight(["BUG"]),
        flight(["MEN"]),
        flight(["MEN"]),
      ],
      2025,
      calendar,
      1,
    );
    expect(tasks.map((t) => t.route)).toEqual([["GRL", "MEN", "GRL"]]);
  });
});

describe("superlatives", () => {
  const calendar = {
    start: { month: 1, day: 1 },
    end: { month: 12, day: 31 },
  };
  const flight = (
    id: string,
    pilot: string,
    date: string,
    task: Partial<Flight["task"]> = {},
  ) => baseFlight({ id, pilot, date: new Date(date), task });
  const byKey = (cards: ReturnType<typeof superlatives>) =>
    Object.fromEntries(cards.map((c) => [c.key, c]));

  const flights = [
    flight("1", "Doe, Jane", "2025-04-02", {
      scoringDistanceKm: 512.34,
      crossCountryPoints: 5000,
      handicappedSpeedKph: 80,
      turnpoints: ["A", "B", "C"],
    }),
    flight("2", "Doe, Jane", "2025-06-01", {
      isFaiTriangle: true,
      scoringDistanceKm: 300,
      crossCountryPoints: 3000,
      handicappedSpeedKph: 95,
    }),
    flight("3", "Roe, Rick", "2025-03-15", {
      scoringDistanceKm: 700,
      crossCountryPoints: 7000,
      handicappedSpeedKph: 120,
      isCompleted: false,
      turnpoints: ["A", "B", "C"],
    }),
    flight("4", "Roe, Rick", "2025-09-20", { scoringDistanceKm: 50 }),
    flight("5", "Roe, Rick", "2025-08-01", { scoringDistanceKm: 60 }),
    flight("6", "Doe, Jane", "2024-06-01", { crossCountryPoints: 1000 }),
    flight("7", "Roe, Rick", "2024-06-01", { crossCountryPoints: 9000 }),
  ];

  it("picks each card's pilot and figure", () => {
    const cards = byKey(superlatives(flights, 2025, calendar));
    expect(cards.mostFlights).toMatchObject({
      pilot: "Roe, Rick",
      value: "3 flights",
    });
    expect(cards.mostKm).toMatchObject({ pilot: "Doe, Jane", value: "812 km" });
    expect(cards.longest).toMatchObject({
      pilot: "Roe, Rick",
      value: "700.0 km",
    });
    // The faster flight wasn't completed
    expect(cards.fastest).toMatchObject({ flight: { id: "2" } });
    expect(cards.fastest.value).toBe("95.0 kph");
    expect(cards.earliest).toMatchObject({ value: "15 Mar" });
    expect(cards.latest).toMatchObject({ value: "20 Sept" });
    expect(cards.topScoring).toMatchObject({
      pilot: "Roe, Rick",
      value: "7,000 pts",
    });
    expect(cards.longestFai).toMatchObject({
      pilot: "Doe, Jane",
      value: "300.0 km",
    });
    expect(cards.mostImproved).toBeUndefined();
    expect(cards.mostTurnpoints).toBeUndefined();
  });

  it("lists every flight on the first and last days, longest first", () => {
    const cards = byKey(
      superlatives(
        [
          ...flights,
          flight("8", "Poe, Pat", "2025-03-15", { scoringDistanceKm: 900 }),
        ],
        2025,
        calendar,
      ),
    );
    const ids = (card: (typeof cards)[string]) =>
      "dayFlights" in card ? card.dayFlights.map((f) => f.id) : [];
    expect(ids(cards.earliest)).toEqual(["8", "3"]);
    expect(ids(cards.latest)).toEqual(["4"]);
  });

  it("leaves out cards nothing qualifies for", () => {
    expect(superlatives([], 2025, calendar)).toEqual([]);
    const cards = byKey(
      superlatives(
        [flight("1", "New, Nina", "2025-05-01", { isCompleted: false })],
        2025,
        calendar,
      ),
    );
    expect(cards.fastest).toBeUndefined();
    expect(cards.longestFai).toBeUndefined();
    expect(cards.longest).toBeDefined();
  });
});

describe("clubGliderStats", () => {
  const calendar = {
    start: { month: 1, day: 1 },
    end: { month: 12, day: 31 },
  };
  const k21 = {
    name: "K21",
    compNo: "HTV",
    registration: "G-CHTV",
    type: "ask\\s*21",
  };
  const perkoz = {
    name: "Perkoz",
    compNo: "PZ",
    registration: "G-PCGC",
    type: "perkoz",
  };
  const flight = (
    registration: string,
    type: string,
    overrides: Parameters<typeof baseFlight>[0] = {},
  ) =>
    baseFlight({
      date: new Date("2025-06-01"),
      ...overrides,
      glider: { registration, type },
    });

  it("totals each glider's flights by registration or comp number", () => {
    const [stats] = clubGliderStats(
      [
        flight("G-CHTV", "ASK 21", {
          pilot: "A",
          task: { scoringDistanceKm: 300, crossCountryPoints: 3000 },
        }),
        flight("htv", "ASK21", {
          pilot: "B",
          task: { scoringDistanceKm: 100, crossCountryPoints: 500 },
        }),
        flight("HTV", "ASK 21", { pilot: "A" }),
        flight("G-CKFY", "ASK 21"),
      ],
      2025,
      calendar,
      [k21],
    );

    expect(stats).toMatchObject({ glider: k21, scoringKm: 600 });
    expect(stats.flights.map((f) => f.glider.registration)).toEqual([
      "G-CHTV",
      "htv",
      "HTV",
    ]);
  });

  it("leaves out another type with the same comp number", () => {
    const [stats] = clubGliderStats(
      [flight("PZ", "SZD54-2 PERKOZ (20.0)"), flight("PZ", "DG 800S (18.0)")],
      2025,
      calendar,
      [perkoz],
    );

    expect(stats.flights).toHaveLength(1);
  });

  it("only counts the season's claimed flights", () => {
    const [stats] = clubGliderStats(
      [
        flight("HTV", "ASK 21", { date: new Date("2024-06-01") }),
        flight("HTV", "ASK 21", { task: { claimType: "H" } }),
      ],
      2025,
      calendar,
      [k21],
    );

    expect(stats.flights).toHaveLength(0);
  });

  it("averages the handicapped speed of completed tasks", () => {
    const [flown, unflown] = clubGliderStats(
      [
        flight("HTV", "ASK 21", { task: { handicappedSpeedKph: 60 } }),
        flight("HTV", "ASK 21", { task: { handicappedSpeedKph: 80 } }),
        flight("HTV", "ASK 21", {
          task: { handicappedSpeedKph: 10, isCompleted: false },
        }),
      ],
      2025,
      calendar,
      [k21, perkoz],
    );

    expect(flown.avgSpeedKph).toBe(70);
    expect(unflown.avgSpeedKph).toBeNull();
  });

  it("lists a glider's flights by most points, then date", () => {
    const [stats] = clubGliderStats(
      [
        flight("HTV", "ASK 21", {
          id: "late",
          date: new Date("2025-07-01"),
          task: { crossCountryPoints: 500 },
        }),
        flight("HTV", "ASK 21", {
          id: "best",
          date: new Date("2025-08-01"),
          task: { crossCountryPoints: 900 },
        }),
        flight("HTV", "ASK 21", {
          id: "early",
          date: new Date("2025-05-01"),
          task: { crossCountryPoints: 500 },
        }),
      ],
      2025,
      calendar,
      [k21],
    );

    expect(stats.flights.map((f) => f.id)).toEqual(["best", "early", "late"]);
  });

  it("lists every glider in config order, unflown ones too", () => {
    const stats = clubGliderStats([flight("PZ", "Perkoz")], 2025, calendar, [
      k21,
      perkoz,
    ]);

    expect(stats.map((s) => [s.glider.compNo, s.flights.length])).toEqual([
      ["HTV", 0],
      ["PZ", 1],
    ]);
  });
});
