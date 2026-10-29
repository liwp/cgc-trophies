import categories from "../../records.config";
import { RECORD_MARGIN } from "../../src/lib/records";
import { currentSeason } from "../../src/lib/season";
import TURNPOINTS from "../../src/lib/turnpoints";

const records = categories.flatMap((c) =>
  [...(c.record ? [c.record] : []), ...c.superseded].map((r) => ({
    category: c.id,
    record: r,
  })),
);

// Every BGA code in a record's route must have been in the BGA list in the
// season the record was flown.
const turnpointCases = records.flatMap(({ category, record }) =>
  record.turnpoints.flatMap((tp) =>
    typeof tp === "string"
      ? [
          {
            category,
            date: record.date,
            code: tp,
            season: currentSeason(new Date(record.date)),
          },
        ]
      : [],
  ),
);

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

  it("gives every category a code and group", () => {
    expect(categories.map((c) => [c.id, c.code, c.group])).toEqual([
      ["longest-distance", "Up to 3 turnpoints", "distance"],
      ["largest-triangle", "FAI triangle", "distance"],
      ["fastest-750", "750km", "any-course"],
      ["fastest-600-triangle", "600km △", "triangle"],
      ["fastest-600-or", "600km O/R", "out-and-return"],
      ["fastest-500-triangle", "500km △", "triangle"],
      ["fastest-500-or", "500km O/R", "out-and-return"],
      ["fastest-400-triangle", "400km △", "triangle"],
      ["fastest-400-or", "400km O/R", "out-and-return"],
      ["fastest-300-triangle", "300km △", "triangle"],
      ["fastest-300-or", "300km O/R", "out-and-return"],
      ["fastest-200-triangle", "200km △", "triangle"],
      ["fastest-200-or", "200km O/R", "out-and-return"],
      ["fastest-100-triangle", "100km △", "triangle"],
      ["fastest-100-or", "100km O/R", "out-and-return"],
      ["absolute-height", "Absolute altitude", "height"],
      ["height-gain", "Gain of height", "height"],
    ]);
  });

  it("uses custom turnpoints only for Molesworth", () => {
    const custom = records.flatMap(({ record }) =>
      record.turnpoints.filter((tp) => typeof tp !== "string"),
    );
    expect(custom).toEqual([{ name: "Molesworth" }]);
  });

  it.each(turnpointCases)(
    "$category $date: $code is a BGA turnpoint in $season",
    ({ code, season }) => {
      const turnpoint = TURNPOINTS[code];
      expect(turnpoint, `unknown turnpoint ${code}`).toBeDefined();
      expect(
        turnpoint.added ?? season,
        `${code} was added in ${turnpoint.added}`,
      ).toBeLessThanOrEqual(season);
      expect(
        turnpoint.removed ?? Number.POSITIVE_INFINITY,
        `${code} was removed in ${turnpoint.removed}`,
      ).toBeGreaterThan(season);
    },
  );

  it("keeps each category's history in date order, each beating the last", () => {
    for (const { id, record, superseded } of categories) {
      const chain = [...superseded, ...(record ? [record] : [])];
      for (let i = 1; i < chain.length; i++) {
        const [prev, next] = [chain[i - 1], chain[i]];
        expect(next.date > prev.date, `${id}: ${next.date}`).toBe(true);
        expect(next.value, `${id}: ${next.date}`).toBeGreaterThan(
          prev.value + RECORD_MARGIN,
        );
      }
    }
  });

  it("lists the 300 km O/R records Drury's flight replaced", () => {
    const c = categories.find((x) => x.id === "fastest-300-or");
    expect(c?.superseded.map((r) => [r.date, r.pilot, r.value])).toEqual([
      ["2003-08-14", "Sarah Kelman", 106.89],
      ["2010-08-31", "Phil Jeffery", 110.9],
      ["2013-08-31", "Iain Baker", 118.3],
    ]);
  });
});
