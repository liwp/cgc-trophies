import { podiumPlaces } from "../../src/lib/medals";
import type { TrophyResults } from "../../src/lib/results";
import type {
  Flight,
  FlightTrophy,
  LadderResult,
  LadderTrophy,
} from "../../src/types";
import { makeFlight } from "../helpers/flight";

const flightTrophy = (id: string): FlightTrophy => ({
  id,
  name: `${id} name`,
  summary: "Test",
  description: "Test",
  expr: [["score", "task.handicappedSpeedKph", "kph"]],
});

const ladderTrophy = (id: string): LadderTrophy => ({
  id,
  type: "ladder",
  name: `${id} name`,
  summary: "Test",
  description: "Test",
  ladderKey: "open",
  groupBy: "pilot",
  topN: 6,
});

const scored = (flight: Flight) => ({
  ...flight,
  score: { value: 1, unit: "kph" },
});

const flightResults = (
  id: string,
  results: Flight[],
  excluded: Flight[] = [],
): TrophyResults => ({
  type: "flight",
  trophy: flightTrophy(id),
  results: results.map(scored),
  excluded: excluded.map((f) => ({ ...scored(f), exclude: "Test" })),
});

const ladderResult = (key: string, flights: Flight[]): LadderResult => ({
  key,
  totalScore: 1,
  totalDistance: 1,
  pilots: [key],
  flights,
});

const ladderResults = (id: string, results: LadderResult[]): TrophyResults => ({
  type: "ladder",
  trophy: ladderTrophy(id),
  results,
  excluded: [],
});

const f = (id: string) => makeFlight({ id });

describe("podiumPlaces", () => {
  test("flight trophy: the first three results get places 1, 2, 3; the fourth gets nothing", () => {
    const places = podiumPlaces([
      flightResults("F", [f("a"), f("b"), f("c"), f("d")]),
    ]);
    expect(places.get("a")).toEqual([
      { place: 1, trophyId: "F", trophyName: "F name", trophySummary: "Test" },
    ]);
    expect(places.get("b")?.[0].place).toBe(2);
    expect(places.get("c")?.[0].place).toBe(3);
    expect(places.has("d")).toBe(false);
  });

  test("ladder trophy: every flight of each top-three result gets that result's place; flights of the fourth result get nothing", () => {
    const places = podiumPlaces([
      ladderResults("L", [
        ladderResult("p1", [f("a1"), f("a2")]),
        ladderResult("p2", [f("b1")]),
        ladderResult("p3", [f("c1"), f("c2")]),
        ladderResult("p4", [f("d1")]),
      ]),
    ]);
    expect(places.get("a1")?.[0].place).toBe(1);
    expect(places.get("a2")?.[0].place).toBe(1);
    expect(places.get("b1")?.[0].place).toBe(2);
    expect(places.get("c2")?.[0].place).toBe(3);
    expect(places.has("d1")).toBe(false);
  });

  test("excluded flights get no place", () => {
    const places = podiumPlaces([flightResults("F", [f("a")], [f("x")])]);
    expect(places.has("x")).toBe(false);
  });

  test("a flight on two podiums lists both, best first", () => {
    const places = podiumPlaces([
      flightResults("F", [f("o1"), f("o2"), f("a")]),
      ladderResults("L", [ladderResult("p1", [f("a")])]),
    ]);
    expect(places.get("a")).toEqual([
      { place: 1, trophyId: "L", trophyName: "L name", trophySummary: "Test" },
      { place: 3, trophyId: "F", trophyName: "F name", trophySummary: "Test" },
    ]);
  });
});
