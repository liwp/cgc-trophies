// Every turnpoint code a trophy task filters on must exist in TURNPOINTS and
// be in the BGA list for the seasons that version of the task applies to, so
// a typo or a retired turnpoint can't silently leave a trophy unwinnable.
import CONFIG from "trophies-config";
import { currentSeason } from "../../src/lib/season";
import TURNPOINTS from "../../src/lib/turnpoints";
import type { TrophyExpr } from "../../src/types";

const TURNPOINT_FIELDS = ["task.turnpoints", "task.start", "task.finish"];

function turnpointCodes(expr: TrophyExpr[] = []): string[] {
  return expr.flatMap((e) => {
    if (e[0] !== "filter" || !TURNPOINT_FIELDS.includes(e[1])) return [];
    const value = e[3];
    return Array.isArray(value) ? value : [value as string];
  });
}

// One case per code per season checked: each history version is checked at
// its last season (untilSeason); the headline version at its first season
// and the current season.
const cases = CONFIG.trophies.flatMap((trophy) => {
  if (trophy.type === "ladder") return [];
  const history = trophy.history ?? [];
  const headlineSeasons = new Set([currentSeason()]);
  if (history.length > 0) {
    headlineSeasons.add(Math.max(...history.map((v) => v.untilSeason)) + 1);
  }
  const versions = [
    ...history.map((v) => ({ expr: v.expr, seasons: [v.untilSeason] })),
    { expr: trophy.expr, seasons: [...headlineSeasons] },
  ];
  return versions.flatMap(({ expr, seasons }) =>
    turnpointCodes(expr).flatMap((code) =>
      seasons.map((season) => ({ trophy: trophy.name, code, season })),
    ),
  );
});

describe("trophy config turnpoints", () => {
  it("has turnpoint filters to check", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(cases)(
    "$trophy: $code is a BGA turnpoint in $season",
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
});
