import {
  findCandidates,
  formatRecordValue,
  isEligible,
  isFaiTriangle,
  recordValue,
} from "../../src/lib/records";
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
    code: id,
    group: "distance",
    rule,
    record:
      value === null
        ? null
        : {
            value,
            pilot: "P",
            turnpoints: [],
            glider: "G",
            date: "2000-01-01",
          },
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

  it("rejects a speed flight over the height-loss limit", () => {
    expect(
      recordValue(orRule, makeFlight({ task: { ...or, heightLoss: 1571 } })),
    ).toBeNull();
    expect(
      recordValue(orRule, makeFlight({ task: { ...or, heightLoss: 1000 } })),
    ).toBe(122.9);
  });

  it("rejects a triangle without FAI geometry", () => {
    const rule: RecordRule = {
      kind: "speed",
      shape: "triangle",
      minDistanceKm: 200,
    };
    const legs = (shortest: number, longest: number) =>
      makeFlight({ task: { triangleLegsPct: { shortest, longest } } });
    expect(recordValue(rule, legs(14, 50))).toBeNull();
    expect(recordValue(rule, legs(30, 36))).toBe(80);
  });

  it("never values height", () => {
    expect(recordValue({ kind: "height" }, makeFlight())).toBeNull();
  });
});

describe("isFaiTriangle", () => {
  const task = (km: number, shortest: number, longest: number) =>
    makeFlight({
      task: { scoringDistanceKm: km, triangleLegsPct: { shortest, longest } },
    }).task;

  it("needs every leg at least 28% under 750 km", () => {
    expect(isFaiTriangle(task(749, 28, 44))).toBe(true);
    expect(isFaiTriangle(task(749, 27.9, 40))).toBe(false);
  });

  it("needs every leg 25-45% from 750 km", () => {
    expect(isFaiTriangle(task(750, 25, 45))).toBe(true);
    expect(isFaiTriangle(task(750, 24.9, 40))).toBe(false);
    expect(isFaiTriangle(task(750, 26, 45.1))).toBe(false);
  });

  it("rejects a triangle without leg data", () => {
    expect(
      isFaiTriangle(makeFlight({ task: { triangleLegsPct: null } }).task),
    ).toBe(false);
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

  const on = (date: string, speed: number, id = date) =>
    makeFlight({
      id,
      date: new Date(date),
      task: { ...orTask, scoringSpeedKph: speed },
    });

  it("needs to beat the record by more than 1 km/h", () => {
    const cats = [category("c", or100, 120)];
    expect(findCandidates(cats, [on("2020-06-01", 121)])).toEqual([]);
    expect(findCandidates(cats, [on("2020-06-01", 121.1)])).toHaveLength(1);
  });

  it("walks flights in date order and records each new record", () => {
    const result = findCandidates(
      [category("c", or100, 100)],
      [
        on("2022-08-14", 133.9),
        on("2010-08-31", 110.9),
        on("2014-07-29", 111.5),
        on("2013-08-31", 118.3),
      ],
    );
    expect(result.map((c) => [c.flight.id, c.beats])).toEqual([
      ["2010-08-31", 100],
      ["2013-08-31", 110.9],
      ["2022-08-14", 118.3],
    ]);
  });

  it("lets a later flight within the margin of a new record lapse", () => {
    const result = findCandidates(
      [category("c", or100, 89.5)],
      [on("2018-06-21", 99), on("2022-08-05", 99.7)],
    );
    expect(result.map((c) => c.flight.id)).toEqual(["2018-06-21"]);
  });

  it("counts only the best flight of a day, without the margin", () => {
    const result = findCandidates(
      [category("c", or100, 100)],
      [on("2020-06-01", 110, "a"), on("2020-06-01", 110.5, "b")],
    );
    expect(result.map((c) => c.flight.id)).toEqual(["b"]);
  });

  it("ignores flights on or before the record's date", () => {
    const cats = [
      {
        ...category("c", or100, 100),
        record: { ...category("c", or100, 100).record!, date: "2020-06-01" },
      },
    ];
    expect(
      findCandidates(cats, [on("2019-01-01", 150), on("2020-06-01", 150)]),
    ).toEqual([]);
  });

  it("never yields height candidates", () => {
    expect(
      findCandidates([category("h", { kind: "height" }, null)], [makeFlight()]),
    ).toEqual([]);
  });
});

describe("formatRecordValue", () => {
  const rec = (
    rule: RecordRule,
    value: number,
    distanceKm?: number,
  ): RecordCategory => ({
    ...category("x", rule, value),
    record: {
      value,
      ...(distanceKm !== undefined && { distanceKm }),
      pilot: "A B",
      turnpoints: [],
      glider: "G",
      date: "2020-01-01",
    },
  });

  it("shows a speed with its distance", () => {
    expect(formatRecordValue(rec(orRule, 116.6, 515.25))).toBe(
      "116.6 km/h (515.3 km)",
    );
  });
  it("shows a speed without a distance", () => {
    expect(formatRecordValue(rec(orRule, 102.5))).toBe("102.5 km/h");
  });
  it("shows a distance in km", () => {
    expect(
      formatRecordValue(rec({ kind: "distance", shape: "any" }, 981.68)),
    ).toBe("981.7 km");
  });
  it("shows a height in feet with a thousands separator", () => {
    expect(formatRecordValue(rec({ kind: "height" }, 12992))).toBe("12,992 ft");
  });
  it("shows No claim without a record", () => {
    expect(formatRecordValue(category("x", orRule, null))).toBe("No claim");
  });
});
