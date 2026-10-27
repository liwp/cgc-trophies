import categories from "../../records.config";

describe("records.config", () => {
  it("has the spec's 17 ids in order", () => {
    expect(categories.map((c) => c.id)).toEqual([
      "longest-distance",
      "largest-triangle",
      "fastest-750",
      "fastest-600-triangle",
      "fastest-600-or",
      "fastest-500-triangle",
      "fastest-500-or",
      "fastest-400-triangle",
      "fastest-400-or",
      "fastest-300-triangle",
      "fastest-300-or",
      "fastest-200-triangle",
      "fastest-200-or",
      "fastest-100-triangle",
      "fastest-100-or",
      "absolute-height",
      "height-gain",
    ]);
  });

  it("has consistent records", () => {
    for (const { rule, record, superseded } of categories) {
      for (const r of [...(record ? [record] : []), ...superseded]) {
        expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        if (rule.kind === "speed" && r.distanceKm !== undefined) {
          expect(r.distanceKm).toBeGreaterThanOrEqual(rule.minDistanceKm);
        }
      }
    }
  });

  it("records Kelman's 500 km O/R as a current UK record", () => {
    const c = categories.find((x) => x.id === "fastest-500-or");
    expect(c?.record?.value).toBe(106.89);
    expect(c?.ukRecord).toEqual({
      status: "current",
      lists: ["UK Standard", "UK Feminine Open"],
    });
  });

  it("has no claim for the 600 km O/R", () => {
    expect(
      categories.find((x) => x.id === "fastest-600-or")?.record,
    ).toBeNull();
  });
});
