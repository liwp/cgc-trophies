import {
  calculateStats,
  categories,
  seasonSummary,
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
      ["500km", 499, false],
      ["500km", 500, true],
      ["500km", 749, true],
      ["500km", 750, false],
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
