import { capitalize } from "lodash";

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
};

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
};

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
  },
  type: "object",
  xform: (task: Record<string, any>) => {
    const pctMatch = task.taskAchievement?.match(/(\d+\.?\d*)%\s*Completed/);
    const pct = pctMatch ? parseFloat(pctMatch[1]) : null;
    const taskDistanceKm =
      pct && pct > 0 && pct < 100
        ? task.scoringDistanceKm / (pct / 100)
        : task.scoringDistanceKm;
    return { ...task, taskDistanceKm };
  },
};

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
};

export { GLIDER_SPEC, LADDERS_SPEC, SPEC, TASK_SPEC };
