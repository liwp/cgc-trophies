import { shouldWarnHeightLoss } from "../../src/lib/heightLoss";

describe("shouldWarnHeightLoss", () => {
  it("flags when computed exceeds reported by more than the margin", () => {
    // reported = 1000 floor (BGA recorded within-limit), computed says over.
    expect(shouldWarnHeightLoss(1200, 1000)).toBe(true);
  });

  it("does not flag when computed exceeds reported by less than the margin", () => {
    // Within computeHeightLoss's observed over-read noise (~130m).
    expect(shouldWarnHeightLoss(1092, 1000)).toBe(false);
  });

  it("does not flag at exactly the margin boundary", () => {
    expect(shouldWarnHeightLoss(1100, 1000)).toBe(false);
  });

  it("does not flag when computed is below reported", () => {
    expect(shouldWarnHeightLoss(800, 1000)).toBe(false);
  });

  it("flags a further under-report above an already-declared over-limit loss", () => {
    expect(shouldWarnHeightLoss(1500, 1300)).toBe(true);
  });

  it("does not flag an honest already-declared over-limit flight", () => {
    expect(shouldWarnHeightLoss(1320, 1300)).toBe(false);
  });
});
