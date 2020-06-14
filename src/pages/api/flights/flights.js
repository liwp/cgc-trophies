const { parseCsv } = require("./csv");

const PILOT_SPEC = {
  forename: {
    header: "Forename",
  },
  surname: {
    header: "Surname",
  },
};

const GLIDER_SPEC = {
  type: {
    header: "Glider",
  },
  handicap: {
    header: "Handicap",
    type: "number",
  },
  isWooden: {
    header: "Wooden?",
    type: "boolean",
  },
  registration: {
    header: "Registration",
  },
};

const LADDERS_SPEC = {
  height: {
    header: "Height Ladder",
    type: "boolean",
  },
  junior: {
    header: "Junior Ladder",
    type: "boolean",
  },
  // bolly
  local1: {
    header: "Local Ladder 1",
    type: "boolean",
  },
  // syndicate
  local2: {
    header: "Local  Ladder 2",
    type: "boolean",
  },
  // club fleet
  local3: {
    header: "Local  Ladder 3",
    type: "boolean",
  },
  // shark
  local4: {
    header: "Local  Ladder 4",
    type: "boolean",
  },
  // fastrackers
  local5: {
    header: "Local  Ladder 5",
    type: "boolean",
  },
  open: {
    header: "Open Ladder",
    type: "boolean",
  },
  weekend: {
    header: "Weekend Ladder",
    type: "boolean",
  },
};

function genTaskSpec() {
  return {
    claimType: {
      header: "Claim Type",
    },
    isCompleted: {
      header: "Completed?",
      type: "boolean",
    },
    crossCountryPoints: {
      header: "Cross Country Points",
      type: "number",
    },
    isDeclared: {
      header: "Declared?",
      type: "boolean",
    },
    scoringDistanceKm: {
      header: "Scoring Distance (km)",
      type: "number",
    },
    handicappedDistanceKm: {
      header: "Handicapped Distance (km)",
      type: "number",
    },
    handicappedSpeedKph: {
      header: "Handicapped Speed (kph)",
      type: "number",
    },
    heightGainFt: {
      header: "Height gain (ft)",
      type: "number",
    },
    launchSite: {
      header: "Launch Site",
    },
    tps: [
      {
        header: "Start Point",
      },
      {
        header: "TP 1",
      },
      {
        header: "TP 2",
      },
      {
        header: "TP 3",
      },
      {
        header: "TP 4",
      },
      {
        header: "Finish Point",
      },
    ],
  };
}

function genSpec() {
  return {
    id: {
      header: "FlightID",
    },
    flightDate: {
      header: "Flight Date",
      type: "date",
    },
    pilot: PILOT_SPEC,
    glider: GLIDER_SPEC,
    ladders: LADDERS_SPEC,
    task: genTaskSpec(),
  };
}

function parseFlights(csv) {
  return parseCsv(csv, genSpec());
}

module.exports = {
  genSpec,
  parseFlights,
};
