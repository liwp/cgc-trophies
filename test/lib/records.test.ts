import { findCandidates, isEligible, recordValue } from "../../src/lib/records";
import type { RecordCategory, RecordRule } from "../../src/types";
import { makeFlight } from "../helpers/flight";

const orRule: RecordRule = {
  kind: "speed",
  shape: "out-and-return",
  minDistanceKm: 300,
};

function category(
  id: string,
  rule: RecordRule,
  value: number | null,
): RecordCategory {
  return {
    id,
    label: id,
    rule,
    record:
      value === null
        ? null
        : { value, pilot: "P", route: "R", glider: "G", date: "2000-01-01" },
    superseded: [],
  };
}

describe("isEligible", () => {
  it("accepts the default flight", () => {
    expect(isEligible(makeFlight())).toBe(true);
  });

  it.each([
    ["other club", { clubName: "Other Club" }],
    ["other launch site", { task: { launchSite: "Husbands Bosworth" } }],
    ["undeclared", { task: { isDeclared: false } }],
    ["not completed", { task: { isCompleted: false } }],
  ])("rejects %s", (_name, overrides) => {
    expect(isEligible(makeFlight(overrides))).toBe(false);
  });
});

describe("recordValue", () => {
  const or = {
    taskShape: "out-and-return" as const,
    scoringDistanceKm: 426.8,
    scoringSpeedKph: 122.9,
    handicappedSpeedKph: 110.7,
  };

  it("uses the actual speed, not the handicapped speed", () => {
    expect(recordValue(orRule, makeFlight({ task: or }))).toBe(122.9);
  });

  it("requires the minimum distance", () => {
    expect(
      recordValue(
        orRule,
        makeFlight({ task: { ...or, scoringDistanceKm: 299 } }),
      ),
    ).toBeNull();
  });

  it("requires the matching shape", () => {
    expect(
      recordValue(
        orRule,
        makeFlight({ task: { ...or, taskShape: "triangle" } }),
      ),
    ).toBeNull();
  });

  it("accepts any shape for shape any", () => {
    const rule: RecordRule = {
      kind: "speed",
      shape: "any",
      minDistanceKm: 200,
    };
    expect(
      recordValue(
        rule,
        makeFlight({ task: { taskShape: "other", scoringSpeedKph: 90 } }),
      ),
    ).toBe(90);
  });

  it("limits turnpoints for distance", () => {
    const rule: RecordRule = {
      kind: "distance",
      shape: "any",
      maxTurnpoints: 3,
    };
    const tps = (turnpoints: string[]) =>
      makeFlight({ task: { turnpoints, scoringDistanceKm: 500 } });
    expect(recordValue(rule, tps(["A", "B", "C"]))).toBe(500);
    expect(recordValue(rule, tps(["A", "B", "C", "D"]))).toBeNull();
  });

  it("requires a triangle for the triangle distance rule", () => {
    const rule: RecordRule = { kind: "distance", shape: "triangle" };
    expect(
      recordValue(rule, makeFlight({ task: { taskShape: "other" } })),
    ).toBeNull();
    expect(recordValue(rule, makeFlight())).toBe(200);
  });

  it("never values height", () => {
    expect(recordValue({ kind: "height" }, makeFlight())).toBeNull();
  });
});

describe("findCandidates", () => {
  const or100: RecordRule = {
    kind: "speed",
    shape: "out-and-return",
    minDistanceKm: 100,
  };
  const orTask = {
    taskShape: "out-and-return" as const,
    scoringDistanceKm: 105.8,
  };

  it("ignores undeclared flights", () => {
    const result = findCandidates(
      [category("fastest-100-or", or100, 139.3)],
      [
        makeFlight({
          id: "u",
          task: { ...orTask, isDeclared: false, scoringSpeedKph: 164.4 },
        }),
        makeFlight({ id: "d", task: { ...orTask, scoringSpeedKph: 150 } }),
      ],
    );
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(150);
    expect(result[0].flight.id).toBe("d");
  });

  it("gives no candidate on a tie", () => {
    const result = findCandidates(
      [category("c", or100, 139.3)],
      [makeFlight({ task: { ...orTask, scoringSpeedKph: 139.3 } })],
    );
    expect(result).toEqual([]);
  });

  it("fills an empty category", () => {
    const flight = makeFlight({ task: { ...orTask, scoringSpeedKph: 50 } });
    const result = findCandidates([category("c", or100, null)], [flight]);
    expect(result).toHaveLength(1);
    expect(result[0].flight).toBe(flight);
  });

  it("returns one flight for several categories", () => {
    const tri = (min: number): RecordRule => ({
      kind: "speed",
      shape: "triangle",
      minDistanceKm: min,
    });
    const cats = [500, 400, 300, 200].map((n) =>
      category(`t${n}`, tri(n), 100),
    );
    const flight = makeFlight({
      task: {
        taskShape: "triangle",
        scoringDistanceKm: 515,
        scoringSpeedKph: 116.6,
      },
    });
    const result = findCandidates(cats, [flight]);
    expect(result.map((c) => c.category.id)).toEqual([
      "t500",
      "t400",
      "t300",
      "t200",
    ]);
  });

  it("never yields height candidates", () => {
    expect(
      findCandidates([category("h", { kind: "height" }, null)], [makeFlight()]),
    ).toEqual([]);
  });
});
