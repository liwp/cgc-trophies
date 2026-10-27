import CONFIG from "trophies-config";
import type {
  CandidateRecord,
  Flight,
  RecordCategory,
  RecordRule,
} from "../types";

/** Filed under the club, launched at its site, declared and completed. */
export function isEligible(flight: Flight): boolean {
  return (
    flight.clubName === CONFIG.club.name &&
    flight.task.launchSite === CONFIG.club.launchSite &&
    flight.task.isDeclared &&
    flight.task.isCompleted
  );
}

/**
 * The flight's value for a category (km or actual km/h), or null if it does
 * not qualify. Assumes the flight is eligible.
 */
export function recordValue(rule: RecordRule, flight: Flight): number | null {
  const { task } = flight;
  switch (rule.kind) {
    case "height":
      return null;
    case "distance":
      if (rule.shape === "triangle" && task.taskShape !== "triangle") {
        return null;
      }
      if (
        rule.maxTurnpoints !== undefined &&
        task.turnpoints.length > rule.maxTurnpoints
      ) {
        return null;
      }
      return task.scoringDistanceKm;
    case "speed":
      if (rule.shape !== "any" && task.taskShape !== rule.shape) {
        return null;
      }
      if (task.scoringDistanceKm < rule.minDistanceKm) {
        return null;
      }
      return task.scoringSpeedKph;
  }
}

/**
 * For each category, the best eligible flight that strictly beats the current
 * record (any qualifying flight if there is none), in category order.
 */
export function findCandidates(
  categories: RecordCategory[],
  flights: Flight[],
): CandidateRecord[] {
  const eligible = flights.filter(isEligible);
  const candidates: CandidateRecord[] = [];
  for (const category of categories) {
    let best: CandidateRecord | undefined;
    const threshold = category.record?.value ?? 0;
    for (const flight of eligible) {
      const value = recordValue(category.rule, flight);
      if (value === null || value <= threshold) continue;
      if (!best || value > best.value) {
        best = { category, flight, value };
      }
    }
    if (best) candidates.push(best);
  }
  return candidates;
}
