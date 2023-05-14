// Common base lines for tasks
const IS_FROM_GRANSDEN_LODGE = [
  "filter",
  "task.launchSite",
  "=",
  "Gransden Lodge",
];
const IS_COMPLETED = ["filter", "task.isCompleted"];
const IS_DECLARED = ["filter", "task.isDeclared"];

// TODO: add trophy type: flight / ladder - this can be used to render things
// differently, but hopefully `eval` can also evaluate the trophy rules
// differently.

// TODO: Maybe trophy eval should only score flights for given trophy? Could we
// then run all trophy expressions on a given flight at one go? That would not
// work for ladder trophies that consist of multiple flights, except we could
// for a given pilot add together all the scores for a ladder trophy and get the
// results. I think it also means that we don't have to do any processing on the
// flights (grouping by pilots etc) before run `eval` on them. And, `eval`
// wouldn't have to know about ladder vs flight trophies, or syndicates...

const TROPHIES = {
  config: {
    default: "5",
    ignore: {},
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
    {
      id: "1",
      name: "A.L.L. Alexander Trophy",
      description:
        "For the highest scoring flight on the BGA ladder flown in a glider with a handicap of 95 or less, launched from Gransden Lodge.",
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        ["filter", "glider.handicap", "<=", 95],
        ["score", "task.crossCountryPoints", "pts"],
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
      id: "3",
      name: "Boomerang",
      description:
        "For the fastest, handicapped out-and-return flight to Shipston-on-Stour(SHP) – 208.7km, not necessarily declared. For pilots who have not completed a UK 500 km flight at the beginning of the season.",
      expr: [
        IS_FROM_GRANSDEN_LODGE,
        IS_COMPLETED,
        ["filter", "task.turnpoints", "<=>", ["SHP"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
      ignore: { 99094: "500km - Robert Welford", 101828: "500km - David Tew" },
    },
    {
      id: "4",
      name: "Double Century Trophy",
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
      ignore: {
        101013: "300km - Jem Davies",
        101070: "300km - Jem Davies",
        102116: "300km - Paul Bonhomme",
      },
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
      id: "7",
      name: "Kelman Clock",
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
      ignore: {
        105786: "whoops",
      },
    },
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
    },
  ],
};

export default TROPHIES;
