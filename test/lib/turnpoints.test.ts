import { currentSeason, FIRST_SEASON } from "../../src/lib/season";
import TURNPOINTS from "../../src/lib/turnpoints";

describe("TURNPOINTS", () => {
  it("includes turnpoints added in a later BGA release", () => {
    expect(TURNPOINTS.HAC).toEqual({ name: "Hawstead Church", added: 2026 });
  });

  it("keeps turnpoints that past seasons' tasks used after they are retired", () => {
    // BSE was in the 2025 Mug Metal Machin winner's task.
    expect(TURNPOINTS.BSE).toEqual({ name: "Bury St Edmunds", removed: 2026 });
  });

  it("exposes names as objects", () => {
    expect(TURNPOINTS.GRL.name).toBe("Gransden Lodge");
    expect(TURNPOINTS.HUS.name).toBe("Husbands Bosworth");
    expect(TURNPOINTS.BNW.name).toBe("Bicester North West");
  });

  it("keeps retired turnpoints with a removed season", () => {
    expect(TURNPOINTS.BIC).toEqual({
      name: "Bicester Control Tower",
      removed: 2026,
    });
  });

  it("leaves added and removed unset for current turnpoints", () => {
    expect(TURNPOINTS.GRL.added).toBeUndefined();
    expect(TURNPOINTS.GRL.removed).toBeUndefined();
  });

  describe("every entry", () => {
    const entries = Object.entries(TURNPOINTS);
    // Retired codes are backfilled from BGA Ladder flights since FIRST_SEASON.
    const earliest = FIRST_SEASON;
    const latest = currentSeason() + 1;

    it("has a BGA-style code and a trimmed, non-empty name", () => {
      for (const [code, { name }] of entries) {
        expect(code, code).toMatch(/^[A-Z0-9]{2,4}$/);
        expect(name, code).not.toBe("");
        expect(name, code).toBe(name.trim());
      }
    });

    it("has added and removed seasons in range, added before removed", () => {
      for (const [code, { added, removed }] of entries) {
        for (const season of [added, removed]) {
          if (season === undefined) continue;
          expect(season, code).toBeGreaterThanOrEqual(earliest);
          expect(season, code).toBeLessThanOrEqual(latest);
        }
        if (added !== undefined && removed !== undefined) {
          expect(added, code).toBeLessThan(removed);
        }
      }
    });
  });
});
