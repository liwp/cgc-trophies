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
});
