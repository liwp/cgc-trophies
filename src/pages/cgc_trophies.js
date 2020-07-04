// Common base lines for tasks
const IS_FROM_GRANSDEN_LODGE = [
  "filter",
  "task.launchSite",
  "=",
  "Gransden Lodge",
];
const IS_COMPLETED = ["filter", "task.isCompleted"];
const IS_DECLARED = ["filter", "task.isDeclared"];

function season({ date }) {
  const month = new Date(date).getMonth();
  return month >= 9 || month <= 2 ? "winter" : "summer";
}

/* Raw flight:
   {
   id: "83184",
   date: "2019-10-11T00:00:00.000Z",
   pilot: "Atkin, Phil",
   glider: {
   type: "ASW 20C (15.0)",
   handicap: 100,
   registration: "G-CHSK",
   },
   ladders: ["height", "open"],
   task: {
   isCompleted: true,
   crossCountryPoints: 0,
   isDeclared: true,
   scoringDistanceKm: 0,
   handicappedDistanceKm: 0,
   handicappedSpeedKph: 0,
   launchSite: "Aboyne",
   start: "",
   finish: "",
   turnpoints: [],
   },
   }
*/

/*
  Trophy images:-

Missing:
- A.L.L. Alexander trophy
- Boal Pot
- Boomerang
- Pons Pot

Open ladder
"https://www.camgliding.uk/wp-content/uploads/2018/01/Pot-Pewter-Pringle-1.jpg"
"https://www.camgliding.uk/wp-content/uploads/2018/01/Pot-Pewter-Pringle-2.jpg"

Club fleet ladder
"https://www.camgliding.uk/wp-content/uploads/2018/01/Presidents-Ladder-1.jpg"

FASTrackers
"https://www.camgliding.uk/wp-content/uploads/2018/01/Ted-Warner-Trophy.jpg"
*/

// TODO: how to check start and finish points? Always GRL? Accept all GRL-related TPs?
// TODO: novice filter
// TODO: allow for single field projections (avoids "_score[0]")
// TODO: combine two years to a single season
// TODO: pass a predicate to 'filter' - this would avoid the 'project' in Kelman clock
// TODO: Kelman clock is not showing the correct result: Steve Woolcock
// TODO: filter out multiple flights for a single pilot
// TODO: add flight ID black list (per trophy?) to remove non-qualifying flights
// TODO: add season selector
// TODO: add trophy selector
// TODO: show current winner of each trophy on main page
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
  // TODO: need to nest this somehow? general stuff vs trophies? We could stick
  // all the trophies in a list and access them by name...
  default: "gransden",
  seasonStart: {
    month: 10,
    day: 1,
  },
  allAlexander: {
    name: "A.L.L. Alexander Trophy",
    description:
      "For the highest scoring flight on the BGA ladder flown in a glider with a handicap of 95 or less, launched from Gransden Lodge.",
    expr: [
      IS_FROM_GRANSDEN_LODGE,
      ["filter", "glider.handicap", "<=", 95],
      ["project", "_score", ["task.crossCountryPoints"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
  boalPot: {
    name: "Boal Pot",
    description:
      "For the fastest, handicapped flight round Soham(SOH), Eastwell(EAW), and Calvert(CAL) – 305.5km. The task can be done either way round.",
    expr: [
      IS_FROM_GRANSDEN_LODGE,
      IS_DECLARED,
      IS_COMPLETED,
      ["filter", "task.turnpoints", "<=>", ["SOH", "EAW", "CAL"]],
      ["project", "_score", ["task.handicappedSpeedKph"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
  boomerang: {
    name: "Boomerang",
    description:
      "For the fastest, handicapped out-and-return flight to Shipston-on-Stour(SHP) – 208.7km, not necessarily declared. For pilots who have not completed a UK 500 km flight at the beginning of the season.",
    expr: [
      IS_FROM_GRANSDEN_LODGE,
      IS_COMPLETED,
      ["filter", "task.turnpoints", "<=>", ["SHP"]],
      ["project", "_score", ["task.handicappedSpeedKph"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
  doubleCentury: {
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
      ["project", "_score", ["task.handicappedSpeedKph"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
  gransden: {
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
      ["project", "_score", ["task.handicappedSpeedKph"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
  jubileeBowl: {
    name: "Jubilee Bowl Trophy",
    description:
      "For the longest, handicapped, completed flight around up to 2 turning points, not necessarily declared.",
    img: [
      "https://www.camgliding.uk/wp-content/uploads/2018/01/Jubilee-Bowl.jpg",
    ],
    expr: [
      IS_FROM_GRANSDEN_LODGE,
      IS_COMPLETED,
      ["filter", "task.turnpoints.length", "=", 2],
      ["project", "_score", ["task.handicappedDistanceKm"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
  kelmanClock: {
    name: "Kelman Clock",
    description:
      "For the longest, handicapped, flight around up to three turning points, launched from GRL during the Winter Season.",
    img: [
      "https://www.camgliding.uk/wp-content/uploads/2018/01/Kelman-Clock.jpg",
    ],
    expr: [
      IS_FROM_GRANSDEN_LODGE,
      IS_COMPLETED,
      ["project", "season", season],
      ["filter", "season", "=", "winter"],
      ["filter", "task.turnpoints.length", "<=", 3],
      ["project", "_score", ["task.handicappedDistanceKm"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
  mugMetalMachin: {
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
      ["project", "_score", ["task.handicappedDistanceKm"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
  ponsPot: {
    name: "Pons Pot Trophy",
    description:
      "For the longest, handicapped, declared, uncompleted flight around up to 3 turning points.",
    expr: [
      IS_FROM_GRANSDEN_LODGE,
      IS_DECLARED,
      ["filter", "task.isCompleted", "=", false],
      ["filter", "task.turnpoints.length", "<=", 3],
      ["project", "_score", ["task.handicappedDistanceKm"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
  sanvilleEnigma: {
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
      ["project", "_score", ["task.handicappedSpeedKph"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
  slazenger: {
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
      ["project", "_score", ["task.handicappedSpeedKph"]],
      ["sort", "_score[0]", "desc"],
    ],
  },
};

export default TROPHIES;
