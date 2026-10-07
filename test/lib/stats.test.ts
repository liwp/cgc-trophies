import {
  calculateStats,
  categories,
  updateCategory,
  updateStats,
} from "../../src/lib/stats";
import type { Flight } from "../../src/types";

const makeFlight = (task: Partial<Flight["task"]> = {}): Flight => ({
  id: "1",
  date: new Date("2025-07-01"),
  clubName: "Cambridge Gliding Centre",
  pilot: "Doe, Jane",
  glider: { type: "Discus", handicap: 100, registration: "G-TEST" },
  ladders: ["open"],
  task: {
    claimType: "C",
    isCompleted: true,
    crossCountryPoints: 100,
    isDeclared: true,
    scoringDistanceKm: 350,
    taskDistanceKm: 350,
    taskAchievement: "Declared/Completed",
    handicappedDistanceKm: 350,
    handicappedSpeedKph: 70,
    launchSite: "Gransden Lodge",
    start: "GRL",
    finish: "GRL",
    turnpoints: [],
    heightLoss: 0,
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
      // @ts-expect-error deliberately drop the flags to hit the defaults
      flight.task = {
        ...flight.task,
        isCompleted: undefined,
        isDeclared: undefined,
      };
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
