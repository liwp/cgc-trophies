import { flightCopyData, ladderCopyData } from "../../src/lib/trophyCopyData";
import type { ScoredFlight, LadderResult } from "../../src/types";

const makeFlight = (overrides?: Partial<ScoredFlight>): ScoredFlight => ({
  id: "116237",
  date: new Date("2024-07-26"),
  pilot: "Holswilder, Alex",
  glider: { type: "Ventus 3", handicap: 100, registration: "G-CKYO" },
  ladders: ["open"],
  task: {
    claimType: "C",
    isCompleted: true,
    isDeclared: true,
    crossCountryPoints: 500,
    scoringDistanceKm: 680,
    taskDistanceKm: 680,
    taskAchievement: "Declared/Completed",
    handicappedDistanceKm: 680,
    handicappedSpeedKph: 74.2,
    launchSite: "Gransden Lodge",
    start: "GRL",
    finish: "GRL",
    turnpoints: ["SHM", "CAX", "BRF"],
  },
  score: { value: 680, unit: "km" },
  ...overrides,
});

describe("flightCopyData", () => {
  it("produces correct label-value pairs", () => {
    const data = flightCopyData(makeFlight());
    const map = Object.fromEntries(data);

    expect(map["Pilot Name"]).toBe("Alex Holswilder");
    expect(map["Aircraft Type"]).toBe("Ventus 3");
    expect(map["Aircraft Reg."]).toBe("G-CKYO");
    expect(map["H/C Distance (kms)"]).toBe("680.00");
    expect(map["H/C Speed (kph)"]).toBe("74.20");
    expect(map["Ladder"]).toBe("https://www.bgaladder.net/flightdetails/116237");
    expect(map["TP1"]).toBe("SHM");
    expect(map["TP2"]).toBe("CAX");
    expect(map["TP3"]).toBe("BRF");
  });

  it("formats date as long weekday format", () => {
    const data = flightCopyData(makeFlight());
    const map = Object.fromEntries(data);
    // Date formatting is locale-dependent; just check it contains the key parts
    expect(map["Date of Flight"]).toMatch(/26/);
    expect(map["Date of Flight"]).toMatch(/2024/);
  });

  it("omits empty turnpoints", () => {
    const flight = makeFlight();
    flight.task.turnpoints = ["SHM"];
    const data = flightCopyData(flight);
    const keys = data.map(([k]) => k);
    expect(keys).toContain("TP1");
    expect(keys).not.toContain("TP2");
  });
});

describe("ladderCopyData", () => {
  const result: LadderResult = {
    key: "Holswilder, Alex",
    totalScore: 18682,
    pilots: ["Holswilder, Alex"],
    flights: [
      makeFlight({ task: { ...makeFlight().task, scoringDistanceKm: 400 } }),
      makeFlight({ task: { ...makeFlight().task, scoringDistanceKm: 350 } }),
    ],
  };

  it("produces correct pairs for pilot-grouped trophy", () => {
    const data = ladderCopyData(result, "pilot");
    const map = Object.fromEntries(data);

    expect(map["Pilot Name"]).toBe("Alex Holswilder");
    expect(map["Points"]).toBe("18,682");
    expect(map["No. Of Flights"]).toBe("2");
    expect(map["Scoring Distance (kms)"]).toBe("750.00");
  });

  it("uses registration + pilots list for syndicate trophy", () => {
    const syndicateResult: LadderResult = {
      key: "G-CKYO",
      totalScore: 12000,
      pilots: ["Holswilder, Alex", "Smith, John"],
      flights: [makeFlight()],
    };
    const data = ladderCopyData(syndicateResult, "registration");
    const map = Object.fromEntries(data);

    expect(map["Pilot Name"]).toBe("G-CKYO (Alex Holswilder, John Smith)");
  });
});
