import CONFIG from "trophies-config";
import type {
  CandidateRecord,
  Flight,
  RecordCategory,
  RecordRule,
} from "../types";
import { formatClubRecordValue } from "./recordDisplay";

/** Filed under the club, launched at its site, declared and completed. */
export function isEligible(flight: Flight): boolean {
  return (
    flight.clubName === CONFIG.club.name &&
    flight.task.launchSite === CONFIG.club.launchSite &&
    flight.task.isDeclared &&
    flight.task.isCompleted
  );
}

/** FAI SC3 3.1.5/3.1.6: a record must beat the current one by this (km or km/h). */
export const RECORD_MARGIN = 1;

/** FAI SC3 3.1.6: a speed claim losing more height than this is void. */
export const MAX_HEIGHT_LOSS_M = 1000;

/**
 * FAI SC3 3.1.8 triangle geometry: under 750 km every leg is at least 28% of
 * the course; from 750 km every leg is 25-45%.
 */
export function isFaiTriangle(task: Flight["task"]): boolean {
  const legs = task.triangleLegsPct;
  if (task.taskShape !== "triangle" || !legs) return false;
  return task.scoringDistanceKm < 750
    ? legs.shortest >= 28
    : legs.shortest >= 25 && legs.longest <= 45;
}

/**
 * The flight's value for a category (km or actual km/h), or null if it does
 * not qualify. Assumes the flight is eligible. Triangles must have FAI
 * geometry, and speed flights must stay within the height-loss limit (the
 * ladder's own figure, which reads 1000 for any flight within it).
 */
export function recordValue(rule: RecordRule, flight: Flight): number | null {
  const { task } = flight;
  if (
    rule.kind !== "height" &&
    rule.shape === "triangle" &&
    !isFaiTriangle(task)
  ) {
    return null;
  }
  switch (rule.kind) {
    case "height":
      return null;
    case "distance":
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
      if (task.heightLoss > MAX_HEIGHT_LOSS_M) {
        return null;
      }
      return task.scoringSpeedKph;
  }
}

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Walk each category's qualifying flights in date order, after the current
 * record's date, and return every flight that would have broken the record at
 * the time (oldest first, so later ones supersede earlier ones). Under FAI SC3,
 * a new record must beat the standing one by RECORD_MARGIN, and of the claims
 * on one day only the best counts (3.1.10). An empty category is filled by the
 * first qualifying flight.
 */
export function findCandidates(
  categories: RecordCategory[],
  flights: Flight[],
): CandidateRecord[] {
  const eligible = flights
    .filter(isEligible)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const candidates: CandidateRecord[] = [];
  for (const category of categories) {
    const since = category.record?.date ?? "";
    let current = category.record?.value ?? null;
    const bestByDay = new Map<string, { flight: Flight; value: number }>();
    for (const flight of eligible) {
      const day = isoDay(flight.date);
      if (day <= since) continue;
      const value = recordValue(category.rule, flight);
      if (value === null) continue;
      const best = bestByDay.get(day);
      if (!best || value > best.value) bestByDay.set(day, { flight, value });
    }
    for (const { flight, value } of bestByDay.values()) {
      if (current !== null && value <= current + RECORD_MARGIN) continue;
      candidates.push({ category, flight, value, beats: current });
      current = value;
    }
  }
  return candidates;
}

/** A category's current record as shown on the records page. */
export function formatRecordValue(category: RecordCategory): string {
  const { record, rule } = category;
  return record ? formatClubRecordValue(rule, record) : "No claim";
}
