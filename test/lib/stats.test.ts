import {
  calculateStats,
  categories,
  updateAttemptedDistance,
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

    it("weekend matches flights flagged on the weekend ladder", () => {
      const weekend = { ...makeFlight(), weekendLadder: true };
      expect(category("weekend").pred(weekend)).toBe(true);
      expect(category("weekend").pred(makeFlight())).toBeFalsy();
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
    ])("%s boundary at %dkm -> %s", (key: string, km: number, expected: boolean) => {
      expect(category(key).pred(makeFlight({ taskDistanceKm: km }))).toBe(
        expected,
      );
    });
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

  describe("updateAttemptedDistance", () => {
    it("uses scoringDistanceKm when tps are absent", () => {
      const result = updateAttemptedDistance(
        { attemptedKm: 10 },
        makeFlight({ scoringDistanceKm: 250 }),
      );
      expect(result.attemptedKm).toBe(260);
    });

    it("uses scoringDistanceKm when any turnpoint id is starred", () => {
      const flight = makeFlight({
        scoringDistanceKm: 200,
        tps: [
          { id: "GRL", lat: 52, lon: 0 },
          { id: "*FIN", lat: 53, lon: 0 },
        ],
      });
      expect(
        updateAttemptedDistance({ attemptedKm: 0 }, flight).attemptedKm,
      ).toBe(200);
    });

    it("sums great-circle legs between turnpoints when none are starred", () => {
      // ~1 degree of latitude between the two points ≈ 111 km.
      const flight = makeFlight({
        scoringDistanceKm: 999,
        tps: [
          { id: "A", lat: 52, lon: 0 },
          { id: "B", lat: 53, lon: 0 },
        ],
      });
      const { attemptedKm } = updateAttemptedDistance(
        { attemptedKm: 0 },
        flight,
      );
      expect(attemptedKm).toBeGreaterThan(110);
      expect(attemptedKm).toBeLessThan(112);
    });

    it("accumulates across multiple legs", () => {
      const flight = makeFlight({
        tps: [
          { id: "A", lat: 52, lon: 0 },
          { id: "B", lat: 53, lon: 0 },
          { id: "C", lat: 52, lon: 0 },
        ],
      });
      const { attemptedKm } = updateAttemptedDistance(
        { attemptedKm: 0 },
        flight,
      );
      // Two ~111 km legs out and back.
      expect(attemptedKm).toBeGreaterThan(221);
      expect(attemptedKm).toBeLessThan(223);
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
