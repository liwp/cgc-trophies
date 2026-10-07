import { currentSeason } from "../../src/lib/season";

describe("currentSeason", () => {
  it("is the previous year before March", () => {
    expect(currentSeason(new Date(2026, 0, 15))).toBe(2025);
    expect(currentSeason(new Date(2026, 1, 28, 23, 59))).toBe(2025);
  });

  it("is the current year once March has started", () => {
    expect(currentSeason(new Date(2026, 2, 1, 0, 1))).toBe(2026);
    expect(currentSeason(new Date(2026, 9, 7))).toBe(2026);
    expect(currentSeason(new Date(2026, 11, 31))).toBe(2026);
  });

  it("defaults to today", () => {
    const now = new Date();
    expect(currentSeason()).toBe(currentSeason(now));
  });
});
