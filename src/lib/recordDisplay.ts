import type {
  ClubRecord,
  RecordCategory,
  RecordGroup,
  RecordRule,
  RecordTurnpoint,
} from "../types";
import TURNPOINTS from "./turnpoints";

export interface TurnpointLabel {
  code: string;
  name: string;
  /** The first season the BGA list no longer had it */
  removed?: number;
  /** Not in the BGA list */
  custom?: true;
}

/** A route turnpoint's code and name; a custom one gets an invented code. */
export function turnpointLabel(tp: RecordTurnpoint): TurnpointLabel {
  if (typeof tp !== "string") {
    return {
      code: `${tp.name.slice(0, 3).toUpperCase()}*`,
      name: tp.name,
      custom: true,
    };
  }
  const turnpoint = TURNPOINTS[tp];
  if (!turnpoint) throw new Error(`Unknown turnpoint ${tp}`);
  return turnpoint.removed === undefined
    ? { code: tp, name: turnpoint.name }
    : { code: tp, name: turnpoint.name, removed: turnpoint.removed };
}

export function turnpointText({ code, removed }: TurnpointLabel): string {
  return removed === undefined ? code : `${code} ’${String(removed).slice(-2)}`;
}

/** A route's turnpoint names in order, noting removed and custom ones. */
export function routeTooltip(turnpoints: RecordTurnpoint[]): string {
  return turnpoints
    .map(turnpointLabel)
    .map(({ name, removed, custom }) => {
      if (custom) return `${name} (custom, not in the BGA list)`;
      return removed === undefined ? name : `${name} (removed ${removed})`;
    })
    .join(" – ");
}

export function ukRecordTooltip(category: RecordCategory): string | null {
  const { ukRecord } = category;
  if (!ukRecord) return null;
  const status = ukRecord.status === "current" ? "Current" : "Former";
  return `${status} UK record: ${ukRecord.lists.join(", ")}`;
}

export const RECORD_GROUPS: { group: RecordGroup; heading: string }[] = [
  { group: "distance", heading: "Distance" },
  { group: "triangle", heading: "Speed: triangles" },
  { group: "out-and-return", heading: "Speed: out-and-returns" },
  { group: "any-course", heading: "Speed: any course" },
  { group: "height", heading: "Height" },
];

export function groupCategories(
  categories: RecordCategory[],
): { heading: string; categories: RecordCategory[] }[] {
  return RECORD_GROUPS.map(({ group, heading }) => ({
    heading,
    categories: categories.filter((c) => c.group === group),
  }));
}

/** The records a category's current record replaced, newest first. */
export function recordHistory(category: RecordCategory): ClubRecord[] {
  return [...category.superseded].reverse();
}

/** A record's achievement as shown on the records page. */
export function formatClubRecordValue(
  rule: RecordRule,
  record: ClubRecord,
): string {
  switch (rule.kind) {
    case "speed":
      // Speeds keep their curated precision (e.g. 106.89); distances round.
      return record.distanceKm === undefined
        ? `${record.value} km/h`
        : `${record.value} km/h (${record.distanceKm.toFixed(1)} km)`;
    case "distance":
      return `${record.value.toFixed(1)} km`;
    case "height":
      return `${record.value.toLocaleString("en-GB")} ft`;
  }
}
