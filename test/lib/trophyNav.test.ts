import { getTrophyNav } from "../../src/lib/trophyNav";

describe("getTrophyNav", () => {
  it("returns prev and next for a middle trophy", () => {
    const nav = getTrophyNav("L2");
    expect(nav.current.id).toBe("L2");
    expect(nav.prev).not.toBeNull();
    expect(nav.prev?.id).toBe("L1");
    expect(nav.next).not.toBeNull();
    expect(nav.next?.id).toBe("L3");
  });

  it("returns null prev for the first trophy", () => {
    const nav = getTrophyNav("L1");
    expect(nav.prev).toBeNull();
    expect(nav.next).not.toBeNull();
  });

  it("returns null next for the last trophy", () => {
    const nav = getTrophyNav("1");
    expect(nav.next).toBeNull();
    expect(nav.prev).not.toBeNull();
  });

  it("returns nulls for unknown trophy ID", () => {
    const nav = getTrophyNav("unknown");
    expect(nav.prev).toBeNull();
    expect(nav.next).toBeNull();
  });
});
