import {
  flightCopyData,
  ladderCopyData,
  ladderFlightDetails,
} from "../../src/lib/trophyCopyData";
import type { FlightDetail } from "../../src/lib/trophyCopyData";
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
  it("produces correct label-value pairs with turnpoints alongside", () => {
    const data = flightCopyData(makeFlight());
    const map = Object.fromEntries(data.map((row) => [row[0], row[1]]));

    expect(map["Pilot Name"]).toBe("Alex Holswilder");
    expect(map["Aircraft Type"]).toBe("Ventus 3");
    expect(map["Aircraft Reg."]).toBe("G-CKYO");
    expect(map["H/C Distance (kms)"]).toBe("680.00");
    expect(map["H/C Speed (kph)"]).toBe("74.20");
    expect(map["Ladder"]).toBe(
      "https://www.bgaladder.net/flightdetails/116237",
    );
    // Turnpoints appear in columns 3-5 starting from row 1, with full names
    expect(data[0]).toHaveLength(2); // Pilot Name row has no turnpoints
    expect(data[1].slice(2)).toEqual(["", "TP1", "SHM Shepton Mallett"]);
    expect(data[2].slice(2)).toEqual(["", "TP2", "CAX Caxton Gibbet"]);
    expect(data[3].slice(2)).toEqual(["", "TP3", "BRF Bradford-on-avon"]);
    // Remaining rows have no turnpoint columns
    expect(data[4]).toHaveLength(2);
  });

  it("formats date as long weekday format", () => {
    const data = flightCopyData(makeFlight());
    const dateValue = data[1][1];
    // Date formatting is locale-dependent; just check it contains the key parts
    expect(dateValue).toMatch(/26/);
    expect(dateValue).toMatch(/2024/);
  });

  it("omits empty turnpoints", () => {
    const flight = makeFlight();
    flight.task.turnpoints = ["SHM"];
    const data = flightCopyData(flight);
    expect(data[0]).toHaveLength(2); // Pilot Name row has no turnpoints
    expect(data[1].slice(2)).toEqual(["", "TP1", "SHM Shepton Mallett"]);
    // No TP2 anywhere
    expect(data[2]).toHaveLength(2);
  });
});

describe("ladderCopyData", () => {
  const result: LadderResult = {
    key: "Holswilder, Alex",
    totalScore: 18682,
    totalDistance: 750,
    pilots: ["Holswilder, Alex"],
    flights: [
      makeFlight({
        id: "116237",
        task: { ...makeFlight().task, scoringDistanceKm: 400 },
      }),
      makeFlight({
        id: "116500",
        task: { ...makeFlight().task, scoringDistanceKm: 350 },
      }),
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

  it("includes BGA ladder links for each flight", () => {
    const data = ladderCopyData(result, "pilot");
    const map = Object.fromEntries(data);

    expect(map["Flight 1"]).toBe(
      "https://www.bgaladder.net/flightdetails/116237",
    );
    expect(map["Flight 2"]).toBe(
      "https://www.bgaladder.net/flightdetails/116500",
    );
  });

  it("uses registration + pilots list for syndicate trophy", () => {
    const syndicateResult: LadderResult = {
      key: "G-CKYO",
      totalScore: 12000,
      totalDistance: 680,
      pilots: ["Holswilder, Alex", "Smith, John"],
      flights: [makeFlight()],
    };
    const data = ladderCopyData(syndicateResult, "registration");
    const map = Object.fromEntries(data);

    expect(map["Pilot Name"]).toBe("G-CKYO (Alex Holswilder, John Smith)");
  });

  it("includes pilot name in flight labels for syndicate trophy", () => {
    const syndicateResult: LadderResult = {
      key: "G-CKYO",
      totalScore: 12000,
      totalDistance: 680,
      pilots: ["Holswilder, Alex", "Smith, John"],
      flights: [
        makeFlight({ id: "116237", pilot: "Holswilder, Alex" }),
        makeFlight({ id: "116500", pilot: "Smith, John" }),
      ],
    };
    const data = ladderCopyData(syndicateResult, "registration");
    const map = Object.fromEntries(data);

    expect(map["Flight 1 (Alex Holswilder)"]).toBe(
      "https://www.bgaladder.net/flightdetails/116237",
    );
    expect(map["Flight 2 (John Smith)"]).toBe(
      "https://www.bgaladder.net/flightdetails/116500",
    );
  });
});

describe("ladderFlightDetails", () => {
  it("maps flights to FlightDetail objects", () => {
    const flights = [makeFlight({ id: "116237", pilot: "Holswilder, Alex" })];
    const result: LadderResult = {
      key: "Holswilder, Alex",
      totalScore: 5000,
      totalDistance: 680,
      pilots: ["Holswilder, Alex"],
      flights,
    };
    const details = ladderFlightDetails(result);

    expect(details).toHaveLength(1);
    expect(details[0]).toEqual({
      pilot: "Alex Holswilder",
      date: new Date("2024-07-26"),
      points: 500,
      distanceKm: 680,
      speedKph: 74.2,
      task: "GRL-SHM-CAX-BRF-GRL",
      ladderUrl: "https://www.bgaladder.net/flightdetails/116237",
      igcUrl:
        "https://igcviewer.bgaladder.net/?igc=https://api.bgaladder.net/api/FlightIGC/116237",
    });
  });
});
