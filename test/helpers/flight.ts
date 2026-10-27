import type { Flight } from "../../src/types";

export type FlightOverrides = Partial<Omit<Flight, "glider" | "task">> & {
  glider?: Partial<Flight["glider"]>;
  task?: Partial<Flight["task"]>;
};

/**
 * A completed, declared 200 km club flight from Gransden Lodge. `glider` and
 * `task` overrides are merged into the defaults, so a test only names the
 * fields it cares about.
 */
export function makeFlight({
  glider,
  task,
  ...overrides
}: FlightOverrides = {}): Flight {
  return {
    id: "1",
    date: new Date("2024-06-15"),
    clubName: "Cambridge Gliding Centre",
    pilot: "Smith, Jane",
    ladders: ["open"],
    ...overrides,
    glider: {
      type: "ASW 20",
      handicap: 100,
      registration: "G-TEST",
      ...glider,
    },
    task: {
      claimType: "C",
      isCompleted: true,
      crossCountryPoints: 100,
      isDeclared: true,
      scoringDistanceKm: 200,
      taskDistanceKm: 200,
      taskAchievement: "100% Completed",
      handicappedDistanceKm: 200,
      handicappedSpeedKph: 80,
      scoringSpeedKph: 80,
      taskShape: "triangle",
      triangleLegsPct: { shortest: 33, longest: 34 },
      launchSite: "Gransden Lodge",
      start: "GRL",
      finish: "GRL",
      turnpoints: ["SHP"],
      heightLoss: 0,
      ...task,
    },
  };
}
