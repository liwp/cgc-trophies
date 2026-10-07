// Type-level tests for the trophy DSL. They are enforced by `bun run typecheck`
// (tsconfig.test.json): each @ts-expect-error fails the type-check if the
// mistake below it ever stops being a type error.
import type { TrophyExpr } from "../../src/types";

describe("TrophyExpr", () => {
  it("accepts every form the config uses", () => {
    const exprs: TrophyExpr[] = [
      ["filter", "task.isCompleted"],
      ["filter", "task.launchSite", "=", "Gransden Lodge"],
      ["filter", "task.isCompleted", "=", false],
      ["filter", "task.turnpoints.length", "<=", 3],
      ["filter", "glider.handicap", "<=", 95],
      ["filter", "task.turnpoints", "<=>", ["BNW", "HUS"]],
      ["score", "task.handicappedSpeedKph", "kph"],
      ["score", "task.handicappedDistanceKm", "km"],
      ["score", "task.crossCountryPoints", "pts"],
      ["sort", "score.value", "desc"],
    ];
    expect(exprs).toHaveLength(10);
  });

  it("rejects common config mistakes", () => {
    // @ts-expect-error misspelt field
    const misspeltField: TrophyExpr = ["filter", "task.launchSit", "=", "X"];
    // @ts-expect-error value of the wrong type for the field
    const wrongValue: TrophyExpr = ["filter", "task.launchSite", "=", 3];
    // @ts-expect-error "<=" needs a number field
    const lteOnString: TrophyExpr = ["filter", "task.launchSite", "<=", 3];
    // @ts-expect-error "<=>" needs a string-array field
    const routeOnNumber: TrophyExpr = ["filter", "glider.handicap", "<=>", []];
    // @ts-expect-error a bare filter needs a boolean field
    const bareNonBoolean: TrophyExpr = ["filter", "task.launchSite"];
    // @ts-expect-error unknown unit
    const badUnit: TrophyExpr = ["score", "task.handicappedSpeedKph", "kmh"];
    // @ts-expect-error scoring needs a number field
    const scoreString: TrophyExpr = ["score", "pilot", "pts"];
    // @ts-expect-error unknown sort order
    const badOrder: TrophyExpr = ["sort", "score.value", "descending"];

    expect([
      misspeltField,
      wrongValue,
      lteOnString,
      routeOnNumber,
      bareNonBoolean,
      badUnit,
      scoreString,
      badOrder,
    ]).toHaveLength(8);
  });
});
