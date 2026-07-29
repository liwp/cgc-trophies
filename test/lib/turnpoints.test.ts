import TURNPOINTS from "../../src/lib/turnpoints";

describe("TURNPOINTS", () => {
  it("keeps every turnpoint", () => {
    expect(Object.keys(TURNPOINTS).length).toBe(1397);
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
