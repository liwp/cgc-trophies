import { capitalize } from "lodash";
import type { Flight, TaskShape } from "../types";
import type { FieldSpec } from "./csv";

const GLIDER_SPEC = {
  src: {
    type: {
      src: "Glider",
      type: "string",
    },
    handicap: {
      src: "Handicap",
      type: "number",
    },
    registration: {
      src: "Registration",
      type: "string",
    },
  },
  type: "object",
} satisfies FieldSpec;

const LADDERS_SPEC = {
  src: {
    height: {
      src: "Height Ladder",
      type: "boolean",
    },
    junior: {
      src: "Junior Ladder",
      type: "boolean",
    },
    local1: {
      src: "Local Ladder 1",
      type: "boolean",
    },
    local2: {
      src: "Local  Ladder 2",
      type: "boolean",
    },
    local3: {
      src: "Local  Ladder 3",
      type: "boolean",
    },
    local4: {
      src: "Local  Ladder 4",
      type: "boolean",
    },
    local5: {
      src: "Local  Ladder 5",
      type: "boolean",
    },
    open: {
      src: "Open Ladder",
      type: "boolean",
    },
    weekend: {
      src: "Weekend Ladder",
      type: "boolean",
    },
  },
  type: "object",
  xform: (ladders: Record<string, boolean>) => {
    return Object.entries(ladders)
      .filter(([_, v]) => v)
      .map(([k]) => k);
  },
} satisfies FieldSpec;

const TASK_SPEC = {
  src: {
    claimType: {
      src: "Claim Type",
      type: "string",
    },
    isCompleted: {
      src: "Completed?",
      type: "boolean",
    },
    crossCountryPoints: {
      src: "Cross Country Points",
      type: "number",
    },
    isDeclared: {
      src: "Declared?",
      type: "boolean",
    },
    scoringDistanceKm: {
      src: "Scoring Distance (km)",
      type: "number",
    },
    handicappedDistanceKm: {
      src: "Handicapped Distance (km)",
      type: "number",
    },
    scoringSpeedKph: {
      src: "Scoring Speed (kph)",
      type: "number",
    },
    taskShape: {
      src: "Task Shape",
      type: "string",
      xform: (shape: string): TaskShape => {
        const trimmed = shape.trim();
        if (trimmed.endsWith("Triangle")) return "triangle";
        if (trimmed === "Out and Return") return "out-and-return";
        return "other";
      },
    },
    isFaiTriangle: {
      src: "Triangle Shape",
      type: "string",
      // The BGA's classification: 2 is an FAI triangle (1.08 shape factor),
      // 1 a near-FAI one (1.05) and 0 any other triangle.
      xform: (code: string) => code.trim() === "2",
    },
    triangleLegsPct: {
      src: "Task Shape",
      type: "string",
      xform: (shape: string) => {
        const m = shape.trim().match(/^([\d.]+)%\/([\d.]+)% Triangle$/);
        return m
          ? { shortest: parseFloat(m[1]), longest: parseFloat(m[2]) }
          : null;
      },
    },
    handicappedSpeedKph: {
      src: "Handicapped Speed (kph)",
      type: "number",
    },
    launchSite: {
      src: "Launch Site",
      type: "string",
    },
    start: {
      src: "Start Point",
      type: "string",
    },
    finish: {
      src: "Finish Point",
      type: "string",
    },
    turnpoints: {
      src: [
        {
          src: "TP 1",
          type: "string",
        },
        {
          src: "TP 2",
          type: "string",
        },
        {
          src: "TP 3",
          type: "string",
        },
        {
          src: "TP 4",
          type: "string",
        },
      ],
      type: "array",
      xform: (tps: string[]) => tps.filter((tp) => tp.trim() !== ""),
    },
    taskAchievement: {
      src: "Task Achievement",
      type: "string",
    },
    heightLoss: {
      src: "Height loss",
      type: "number",
    },
    distancePenaltyKm: {
      src: "Distance Penalty",
      type: "number",
    },
  },
  type: "object",
  // Derive the declared task distance from the CSV. The CSV has no TaskDistance
  // column, so we reverse it out of "X% Completed" in the Task Achievement text:
  // taskDistance = scoringDistance / (pct/100). This is deliberate — see closed
  // trophies-ouv. taskDistanceKm only feeds coarse 100km-wide stats buckets
  // (stats.ts), not trophy scoring, so the rounding error is immaterial and not
  // worth a per-flight FLIGHT/{id} request to refine. Completed/missing-pct
  // flights fall back to scoringDistanceKm (≈ task distance when completed).
  xform: (task: Omit<Flight["task"], "taskDistanceKm">): Flight["task"] => {
    const pctMatch = task.taskAchievement?.match(/(\d+\.?\d*)%\s*Completed/);
    const pct = pctMatch ? parseFloat(pctMatch[1]) : null;
    const taskDistanceKm =
      pct && pct > 0 && pct < 100
        ? task.scoringDistanceKm / (pct / 100)
        : task.scoringDistanceKm;
    return { ...task, taskDistanceKm };
  },
} satisfies FieldSpec;

const SPEC = {
  src: {
    id: {
      src: "FlightID",
      type: "string",
    },
    date: {
      src: "Flight Date",
      type: "date",
    },
    clubName: {
      src: "Club Name",
      type: "string",
    },
    pilot: {
      src: {
        first: {
          src: "Forename",
          type: "string",
        },
        last: {
          src: "Surname",
          type: "string",
        },
      },
      type: "object",
      xform: ({ first, last }: { first: string; last: string }) =>
        `${capitalize(last)}, ${capitalize(first)}`,
    },
    glider: GLIDER_SPEC,
    ladders: LADDERS_SPEC,
    task: TASK_SPEC,
  },
  type: "object",
} satisfies FieldSpec;

export { GLIDER_SPEC, LADDERS_SPEC, SPEC, TASK_SPEC };
