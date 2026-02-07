import type { TrophiesConfig, FlightTrophy, LadderTrophy, Trophy } from "../types";

// Common base lines for tasks
const IS_FROM_GRANSDEN_LODGE: any[] = [
  "filter",
  "task.launchSite",
  "=",
  "Gransden Lodge",
];
const IS_COMPLETED: any[] = ["filter", "task.isCompleted"];
const IS_DECLARED: any[] = ["filter", "task.isDeclared"];

const TROPHIES: TrophiesConfig = {
  config: {
    default: "5",
    exclude: {},
    season: {
      start: {
        month: 1,
        day: 1,
      },
      end: {
        month: 12,
        day: 31,
      },
    },
  },
  trophies: [
    // --- Ladder trophies ---
    {
      id: "L1",
      type: "ladder",
      name: "Pot Pewter Pringle",
      description:
        "Open ladder: aggregate of best 6 cross-country point scores on the BGA Open Ladder.",
      ladderKey: "open",
      groupBy: "pilot",
      topN: 6,
    },
    {
      id: "L2",
      type: "ladder",
      name: "Glass Jug",
      description:
        "Weekend ladder: aggregate of best 6 cross-country point scores on the BGA Weekend Ladder.",
      ladderKey: "weekend",
      groupBy: "pilot",
      topN: 6,
    },
    {
      id: "L3",
      type: "ladder",
      name: "Presidents Trophy",
      description:
        "Club Fleet ladder: aggregate of best 6 cross-country point scores flown in club fleet gliders.",
      ladderKey: "local3",
      groupBy: "pilot",
      topN: 6,
    },
    {
      id: "L4",
      type: "ladder",
      name: "Wed Warner Trophy",
      description:
        "Fastrackers ladder: aggregate of best 6 cross-country point scores on the Fastrackers Ladder.",
      ladderKey: "local5",
      groupBy: "pilot",
      topN: 6,
    },
    {
      id: "L5",
      type: "ladder",
      name: "Complicity Cup",
      description:
        "Syndicate ladder: aggregate of best 6 cross-country point scores per glider registration. Requires at least 2 different pilots.",
      ladderKey: "local2",
      groupBy: "registration",
      topN: 6,
      minPilots: 2,
    },
    {
      id: "L6",
      type: "ladder",
      name: "Bottle of Bolly Challenge",
      description:
        "Bolly/ASW19 ladder: aggregate of best 6 cross-country point scores on the Bolly Ladder.",
      ladderKey: "local1",
      groupBy: "pilot",
      topN: 6,
    },
    {
      id: "L7",
      type: "ladder",
      name: "Shark Challenge",
      description:
        "Shark ladder: aggregate of best 6 cross-country point scores on the Shark Ladder.",
      ladderKey: "local4",
      groupBy: "pilot",
      topN: 6,
    },
    // --- Flight trophies ---
    {
      id: "8",
      name: "Mug Metal Machin Trophy",
      description:
        "For the longest, handicapped, declared, completed flight around up to 3 turning points.",
      img: [
        "https://www.camgliding.uk/wp-content/uploads/2018/01/Mug-Metal-Machin-1.jpg",
      ],
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_DECLARED,
        IS_COMPLETED,
        ["filter", "task.turnpoints.length", "<=", 3],
        ["score", "task.handicappedDistanceKm", "km"],
        ["sort", "score.value", "desc"],
      ],
      include: {
        78692: "Navigational TP - Malte Grosche (2019)",
      },
    },
    {
      id: "6",
      name: "Jubilee Bowl",
      description:
        "For the longest, handicapped, completed flight around up to 2 turning points, not necessarily declared.",
      img: [
        "https://www.camgliding.uk/wp-content/uploads/2018/01/Jubilee-Bowl.jpg",
      ],
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_COMPLETED,
        ["filter", "task.turnpoints.length", "=", 2],
        ["score", "task.handicappedDistanceKm", "km"],
        ["sort", "score.value", "desc"],
      ],
    },
    {
      id: "9",
      name: "Pons Pot",
      description:
        "For the longest, handicapped, declared, uncompleted flight around up to 3 turning points.",
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_DECLARED,
        ["filter", "task.isCompleted", "=", false],
        ["filter", "task.turnpoints.length", "<=", 3],
        ["score", "task.handicappedDistanceKm", "km"],
        ["sort", "score.value", "desc"],
      ],
      include: { 85196: "Navigational TP - Malte Grosche (2020)" },
    },
    {
      id: "5",
      name: "Gransden Trophy",
      description:
        "For the fastest, handicapped speed around turning points at Burley Gate (BUG) and Mendlesham Mast (MEN) – 507km. The task can be done either way round.",
      img: [
        "https://www.camgliding.uk/wp-content/uploads/2018/01/Gransden-Trophy-e1515083987492.jpg",
      ],
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_DECLARED,
        IS_COMPLETED,
        ["filter", "task.turnpoints", "<=>", ["BUG", "MEN"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
    },
    {
      id: "2",
      name: "Boal Pot",
      description:
        "For the fastest, handicapped flight round Soham(SOH), Eastwell(EAW), and Calvert(CAL) – 305.5km. The task can be done either way round.",
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_DECLARED,
        IS_COMPLETED,
        ["filter", "task.turnpoints", "<=>", ["SOH", "EAW", "CAL"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
    },
    {
      id: "10",
      name: "Sanville Enigma",
      description:
        "For the fastest, handicapped out-and-return flight to Great Malvern(GRM) – 305km.",
      img: [
        "https://www.camgliding.uk/wp-content/uploads/2018/01/Sanville-Enigma-Trophy.jpg",
      ],
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_DECLARED,
        IS_COMPLETED,
        ["filter", "task.turnpoints", "<=>", ["GRM"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
    },
    {
      id: "3",
      name: "The Boomerang",
      description:
        "For the fastest, handicapped out-and-return flight to Shipston-on-Stour(SHP) – 208.7km, not necessarily declared. For pilots who have not completed a UK 500 km flight at the beginning of the season.",
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_COMPLETED,
        ["filter", "task.turnpoints", "<=>", ["SHP"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
      exclude: {
        70424: "500km - Wendy Head (2018)",
        70456: "500km - David Tew (2018)",
        78319: "500km - Stephen Gibson (2019)",
        80474: "500km - Stephen Gibson (2019)",
        87519: "500km - Robert Theil (2020)",
        90002: "500km - Phil Jeffery (2021)",
        99094: "500km - Robert Welford (2022)",
        101828: "500km - David Tew (2022)",
      },
    },
    {
      id: "4",
      name: "Double Century",
      description:
        "Fastest handicapped flight: Bicester Control Tower (BIC) – Husbands Bosworth (HUS) – 205.0km. For pilots who have not flown a 300km at the start of the ladder season. The task can be done either way round.",
      img: [
        "https://www.camgliding.uk/wp-content/uploads/2018/01/Double-Century.jpg",
      ],
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_DECLARED,
        IS_COMPLETED,
        ["filter", "task.turnpoints", "<=>", ["BIC", "HUS"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
      exclude: {
        78303: "300km - Oliver Bosanko (2019)",
        78871: "300km - Robert Theil (2019)",
        89774: "300km - Robert Theil (2021)",
        89804: "300km - Mike Smith (2021)",
        94246: "300km - Peter Belcher (2021)",
        101013: "300km - Jem Davies (2022)",
        101070: "300km - Jem Davies (2022)",
        102116: "300km - Paul Bonhomme (2022)",
      },
    },
    {
      id: "11",
      name: "Slazenger Trophy",
      description:
        "For the fastest, handicapped flight around the Slazenger triangle: Turning points at Newport Pagnell and Rushden (110Km). The Task can be done either way round. For novices only.",
      img: [
        "https://www.camgliding.uk/wp-content/uploads/2018/01/Slazenger-Trophy-1.jpg",
        "https://www.camgliding.uk/wp-content/uploads/2018/01/Slazenger-Trophy-2.jpg",
      ],
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_DECLARED,
        IS_COMPLETED,
        ["filter", "task.turnpoints", "<=>", ["NPT", "RUS"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
      exclude: {
        86545: "300km - Oliver Bosanko",
        86543: "300km - Oliver Bosanko",
      },
    },
    {
      id: "7",
      name: "The Kelman Clock",
      description:
        "For the longest, handicapped, flight around up to three turning points, launched from GRL during the Winter Season.",
      img: [
        "https://www.camgliding.uk/wp-content/uploads/2018/01/Kelman-Clock.jpg",
      ],
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_COMPLETED,
        ["filter", "task.turnpoints.length", "<=", 3],
        ["score", "task.handicappedDistanceKm", "km"],
        ["sort", "score.value", "desc"],
      ],
      season: {
        start: {
          month: 10,
          day: 1,
        },
        end: {
          month: 3,
          day: 31,
        },
      },
      exclude: {
        105786: "whoops (2022)",
      },
    },
    {
      id: "1",
      name: "The A.L.L. Alexander Trophy",
      description:
        "For the highest scoring flight on the BGA ladder flown in a glider with a handicap of 95 or less, launched from Gransden Lodge.",
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        ["filter", "glider.handicap", "<=", 95],
        ["score", "task.crossCountryPoints", "pts"],
        ["sort", "score.value", "desc"],
      ],
    },
  ] as Trophy[],
};

export default TROPHIES;
