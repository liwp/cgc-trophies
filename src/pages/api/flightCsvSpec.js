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
    // bolly
    local1: {
      src: "Local Ladder 1",
      type: "boolean",
    },
    // syndicate
    local2: {
      src: "Local  Ladder 2",
      type: "boolean",
    },
    // club fleet
    local3: {
      src: "Local  Ladder 3",
      type: "boolean",
    },
    // shark
    local4: {
      src: "Local  Ladder 4",
      type: "boolean",
    },
    // fastrackers
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
  xform: (ladders) => {
    return Object.entries(ladders)
      .filter(([_, v]) => v)
      .map(([k]) => k);
  },
};

const TASK_SPEC = {
  src: {
    // TODO: not sure what this means. We include only 'C' in stats
    // calculations.
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
      xform: (tps) => tps.filter((tp) => tp.trim() !== ""),
    },
  },
  type: "object",
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
      xform: ({ first, last }) => `${last}, ${first}`,
    },
    glider: GLIDER_SPEC,
    ladders: LADDERS_SPEC,
    task: TASK_SPEC,
  },
  type: "object",
};

module.exports = {
  GLIDER_SPEC,
  LADDERS_SPEC,
  SPEC,
  TASK_SPEC,
};
