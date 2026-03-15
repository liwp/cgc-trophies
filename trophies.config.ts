import type {
  TrophiesConfig,
  FlightTrophy,
  LadderTrophy,
  Trophy,
} from "./src/types";

// =============================================================================
// TROPHIES CONFIGURATION
// =============================================================================
//
// This file is the single source of truth for all club-specific configuration.
// To adapt this app for a different gliding club, edit the values below.
//
// STRUCTURE
// ---------
//
// club:
//   name        — Full club name, displayed in headers and metadata.
//   shortName   — Short abbreviation used in page titles (e.g. "CGC 2025 Trophies").
//   code        — The club's identifier on the BGA Ladder API. This is the code
//                  used in the URL: api.bgaladder.net/api/getlogfilescsv/{year}/{code}
//                  Find your club's code at https://bgaladder.net.
//   launchSite  — The launch site name as it appears in BGA Ladder flight data.
//                  Used to filter flights to only those launched from this site.
//
// season:
//   The default competition season date range. Most trophies use the calendar
//   year (Jan 1 – Dec 31). Individual trophies can override this with their own
//   season (e.g. the Kelman Clock runs Oct 1 – Mar 31 for winter flights).
//
// pilotMilestones:
//   Maps milestone names (e.g. "300km", "500km") to pilot → year records.
//   Year is the season the pilot achieved the milestone. Use 0 as a sentinel
//   for "always ineligible" (milestone achieved before tracking began).
//   Trophies reference milestones via excludePilotsWithMilestone: a pilot
//   is excluded if their milestone year < the current season (or year === 0).
//
// trophies:
//   An array of trophy definitions. There are two types:
//
//   LADDER TROPHIES (type: "ladder")
//     Aggregate the best N flights by cross-country points from a specific BGA
//     ladder. Grouped by pilot or by glider registration (for syndicate trophies).
//     Fields:
//       id        — Unique trophy identifier, used in URLs.
//       name      — Display name of the trophy.
//       description — Explains the trophy's criteria.
//       ladderKey — Which BGA ladder to score from (e.g. "open", "weekend",
//                    "local1"–"local5"). These correspond to the ladder names
//                    in the BGA flight data.
//       groupBy   — "pilot" groups flights by pilot name.
//                    "registration" groups by glider registration and requires
//                    at least 2 different pilots to have flown that glider.
//       topN      — How many top flights to sum for the total score.
//       gliderFilter — Optional array of case-insensitive regex patterns tested
//                    against flight.glider.type. Only flights matching at least
//                    one pattern are included (e.g. ["asw\\s*19", "pegase"]).
//
//   FLIGHT TROPHIES (type: "flight" or omitted)
//     Score individual flights using a DSL of filter/score/sort expressions,
//     evaluated as a lodash chain. Each trophy's `expr` array is a pipeline:
//
//       ["filter", field, comparator, value]
//         Keeps flights where field <comparator> value is true.
//         Comparators: "=" (equals), "<=" (less/equal), "<=>" (array equality
//         in either direction, for reversible routes like BUG-MEN or MEN-BUG).
//         If comparator and value are omitted, filters where field is truthy.
//
//       ["score", field, unit]
//         Sets each flight's score to the value of field, labelled with unit
//         (e.g. "km", "kph", "pts").
//
//       ["sort", field, order]
//         Sorts by field in the given order ("asc" or "desc").
//
//     Additional fields:
//       season    — Optional override of the default season date range.
//       exclude   — {flightId: "reason"} map of flights to exclude (e.g.
//                    pilots who don't qualify for a novice trophy).
//       include   — {flightId: "reason"} map of flights to force-include
//                    (e.g. flights with an extra navigational turnpoint that
//                    would otherwise be filtered out).
//       img       — Optional array of image URLs for the trophy.
//
// =============================================================================

const config: TrophiesConfig = {
  club: {
    name: "Cambridge Gliding Centre",
    shortName: "CGC",
    code: "CAM",
    launchSite: "Gransden Lodge",
  },
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
  pilotMilestones: {
    "300km": {
      "Bosanko, Oliver": 0,
      "Theil, Robert": 0,
      "Smith, Mike": 0,
      "Belcher, Peter": 0,
      "Davies, Jem": 0,
      "Bonhomme, Paul": 0,
      "Alexander, James": 2024,
      "Pesonen, Lauri": 2020,
    },
    "500km": {
      "Head, Wendy": 0,
      "Tew, David": 0,
      "Gibson, Stephen": 0,
      "Theil, Robert": 0,
      "Jeffery, Phil": 0,
      "Welford, Robert": 0,
      "Alexander, James": 2024,
      "Pesonen, Lauri": 2025,
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
      ladderKey: "local1",
      groupBy: "pilot",
      topN: 6,
    },
    {
      id: "L4",
      type: "ladder",
      name: "Ted Warner Trophy",
      description:
        "Fastrackers ladder: aggregate of best 6 cross-country point scores on the Fastrackers Ladder.",
      ladderKey: "local5",
      groupBy: "pilot",
      topN: 6,
      excludePilotsWithMilestone: "300km",
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
    },
    {
      id: "L6",
      type: "ladder",
      name: "Bottle of Bolly Challenge",
      description:
        "Bolly/ASW19 ladder: aggregate of best 6 cross-country point scores on the Bolly Ladder.",
      ladderKey: "local3",
      groupBy: "pilot",
      topN: 6,
      gliderFilter: ["asw\\s*19", "pegase"],
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "task.isDeclared"],
        ["filter", "task.isCompleted"],
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "task.isCompleted"],
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "task.isDeclared"],
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "task.isDeclared"],
        ["filter", "task.isCompleted"],
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "task.isDeclared"],
        ["filter", "task.isCompleted"],
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "task.isDeclared"],
        ["filter", "task.isCompleted"],
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "task.isCompleted"],
        ["filter", "task.turnpoints", "<=>", ["SHP"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
      excludePilotsWithMilestone: "500km",
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "task.isDeclared"],
        ["filter", "task.isCompleted"],
        ["filter", "task.turnpoints", "<=>", ["BIC", "HUS"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
      excludePilotsWithMilestone: "300km",
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "task.isDeclared"],
        ["filter", "task.isCompleted"],
        ["filter", "task.turnpoints", "<=>", ["NPT", "RUS"]],
        ["score", "task.handicappedSpeedKph", "kph"],
        ["sort", "score.value", "desc"],
      ],
      excludePilotsWithMilestone: "300km",
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "task.isCompleted"],
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
        ["filter", "task.launchSite", "=", "Gransden Lodge"],
        ["filter", "glider.handicap", "<=", 95],
        ["score", "task.crossCountryPoints", "pts"],
        ["sort", "score.value", "desc"],
      ],
    },
  ] as Trophy[],
};

export default config;
