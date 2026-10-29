/**
 * Cambridge Gliding Centre club records.
 *
 * Sources: the 2023 club records document (the baseline, below) and Alex
 * Holswilder's unverified "Proposed Revision" of 11 July 2026 (not merged).
 * Speeds are actual speeds. Records approved on 2026-10-27 from the ladder
 * (FAI SC3 rules) replace the baseline, which is kept in `superseded`.
 * Histories (approved 2026-10-28) list the records before 2007 that the 2023
 * document gives, then the ladder flights from 2007 that beat them in turn; a
 * longer flight counts for the shorter categories too. The 400 km O/R keeps
 * Bridge's 2004 flight, as the document does, although Kelman's faster 2003
 * O/R also qualified.
 * Candidate new records come from
 * `scripts/club-records.ts`, which never edits this file; update it by hand.
 */
import type { ClubRecord, RecordCategory, RecordRule } from "./src/types";

const triangle500: ClubRecord = {
  value: 116.6,
  distanceKm: 515.25,
  pilot: "Phil Jeffery",
  turnpoints: ["BIC", "SCU", "GAB"],
  glider: "Ventus 2cxt",
  date: "2010-04-22",
};

// Phil Jeffery's 2014 triangle holds both the 300 and 200 km triangle records.
const triangle300: ClubRecord = {
  value: 120.2,
  distanceKm: 305.59,
  pilot: "Phil Jeffery",
  turnpoints: ["CAL", "EAW", "SOH"],
  glider: "Ventus 2cx",
  date: "2014-07-29",
  flightId: "49654",
};

// Graham Drury's 2022 O/R holds both the 300 and 200 km O/R records.
const outAndReturn300: ClubRecord = {
  value: 133.9,
  distanceKm: 302.51,
  pilot: "Graham Drury",
  turnpoints: ["GRM"],
  glider: "ASW 27B",
  date: "2022-08-14",
  flightId: "104680",
};

// Sarah Kelman's 2003 O/R, over 500 km, also held the 300 km O/R record.
const outAndReturn500: ClubRecord = {
  value: 106.89,
  distanceKm: 509.7,
  pilot: "Sarah Kelman",
  turnpoints: ["NRT"],
  glider: "ASW 28",
  date: "2003-08-14",
};

// Great Malvern O/Rs that held the 300 and 200 km O/R records in turn.
const outAndReturnJeffery2010: ClubRecord = {
  value: 110.9,
  distanceKm: 302.5,
  pilot: "Phil Jeffery",
  turnpoints: ["GRM"],
  glider: "Ventus 2cx",
  date: "2010-08-31",
  flightId: "29151",
};

const outAndReturnBaker2013: ClubRecord = {
  value: 118.3,
  distanceKm: 302.5,
  pilot: "Iain Baker",
  turnpoints: ["GRM"],
  glider: "Antares",
  date: "2013-08-31",
  flightId: "44883",
};

// Ladder triangles from 2007-08 that held several triangle records in turn.
const bridgeTriangle2007: ClubRecord = {
  value: 85.5,
  distanceKm: 517.9,
  pilot: "John Bridge",
  turnpoints: ["NEW", "WKE", "NMT"],
  glider: "LS6c (17.5)",
  date: "2007-07-30",
  flightId: "11992",
};

const jefferyTriangle2007a: ClubRecord = {
  value: 92.5,
  distanceKm: 393.2,
  pilot: "Phil Jeffery",
  turnpoints: ["OXF", "NWK", "NMT"],
  glider: "LS8",
  date: "2007-07-29",
  flightId: "11852",
};

const jefferyTriangle2007b: ClubRecord = {
  value: 97.7,
  distanceKm: 305.6,
  pilot: "Phil Jeffery",
  turnpoints: ["SOH", "EAW", "CAL"],
  glider: "LS8",
  date: "2007-08-10",
  flightId: "12694",
};

const jefferyTriangle2008a: ClubRecord = {
  value: 99.8,
  distanceKm: 414.4,
  pilot: "Phil Jeffery",
  turnpoints: ["AND", "GRM"],
  glider: "Ventus 2cx",
  date: "2008-06-16",
  flightId: "15856",
};

const jefferyTriangle2008b: ClubRecord = {
  value: 109.1,
  distanceKm: 405.4,
  pilot: "Phil Jeffery",
  turnpoints: ["BIC", "NWK", "BSE"],
  glider: "Ventus 2cx",
  date: "2008-08-15",
  flightId: "17187",
};

// John Birch's 1996 O/R held the 200 and 100 km O/R records.
const outAndReturnBirch1996: ClubRecord = {
  value: 109.0,
  distanceKm: 221.6,
  pilot: "John Birch",
  turnpoints: ["NWK"],
  glider: "LS8",
  date: "1996-08-19",
};

const speed = (
  shape: "any" | "triangle" | "out-and-return",
  minDistanceKm: number,
): RecordRule => ({ kind: "speed", shape, minDistanceKm });

const categories: RecordCategory[] = [
  {
    id: "longest-distance",
    label: "Longest distance (up to 3 TPs)",
    code: "Up to 3 turnpoints",
    group: "distance",
    rule: { kind: "distance", shape: "any", maxTurnpoints: 3 },
    record: {
      value: 981.68,
      pilot: "Phil Jones",
      turnpoints: ["BRU", "TIB", "HAD"],
      glider: "Ventus 2cx",
      date: "2004-05-22",
    },
    superseded: [],
  },
  {
    id: "largest-triangle",
    label: "Largest triangle",
    code: "FAI triangle",
    group: "distance",
    rule: { kind: "distance", shape: "triangle" },
    record: {
      value: 762.8,
      pilot: "Mike Young",
      turnpoints: ["BRU", "WH2", "TIB"],
      glider: "LS8",
      date: "2002-05-19",
    },
    superseded: [],
  },
  {
    id: "fastest-750",
    label: "Fastest 750 km",
    code: "750km",
    group: "any-course",
    rule: speed("any", 750),
    record: {
      value: 99.0,
      distanceKm: 767.16,
      pilot: "Robert Welford",
      turnpoints: ["SEW", "COC", "CHD"],
      glider: "ASG 29",
      date: "2018-06-21",
      flightId: "71348",
    },
    superseded: [
      {
        value: 89.5,
        distanceKm: 766.8,
        pilot: "John Bridge",
        turnpoints: ["FRO", "THE", "SWS"],
        glider: "LS6c (17.5)",
        date: "1998-07-25",
      },
    ],
  },
  {
    id: "fastest-600-triangle",
    label: "Fastest 600 km triangle",
    code: "600km △",
    group: "triangle",
    rule: speed("triangle", 600),
    record: {
      value: 98.8,
      distanceKm: 600.71,
      pilot: "Phil Jeffery",
      turnpoints: ["TAL", "BLW"],
      glider: "Ventus 3",
      date: "2022-08-05",
      flightId: "103757",
    },
    superseded: [
      {
        value: 90.8,
        distanceKm: 607.5,
        pilot: "Phil Jeffery",
        turnpoints: ["BS2", "LYR", "ROS"],
        glider: "Ventus 2cx",
        date: "2010-05-28",
        flightId: "26462",
      },
      {
        value: 96.9,
        distanceKm: 607.46,
        pilot: "Phil Jeffery",
        turnpoints: ["ROS", "LYR", "BS2"],
        glider: "Ventus 2cxt",
        date: "2011-06-14",
      },
    ],
  },
  {
    id: "fastest-600-or",
    label: "Fastest 600 km O/R",
    code: "600km O/R",
    group: "out-and-return",
    rule: speed("out-and-return", 600),
    record: null,
    superseded: [],
  },
  {
    id: "fastest-500-triangle",
    label: "Fastest 500 km triangle",
    code: "500km △",
    group: "triangle",
    rule: speed("triangle", 500),
    record: { ...triangle500 },
    superseded: [
      { ...bridgeTriangle2007 },
      {
        value: 91.1,
        distanceKm: 504.9,
        pilot: "Phil Jeffery",
        turnpoints: ["LRI", "NWK", "TIB"],
        glider: "Ventus 2cx",
        date: "2008-07-04",
        flightId: "16248",
      },
    ],
    ukRecord: { status: "former", lists: ["UK Open"] },
  },
  {
    id: "fastest-500-or",
    label: "Fastest 500 km O/R",
    code: "500km O/R",
    group: "out-and-return",
    rule: speed("out-and-return", 500),
    record: { ...outAndReturn500 },
    superseded: [],
    ukRecord: { status: "current", lists: ["UK Standard", "UK Feminine Open"] },
  },
  {
    id: "fastest-400-triangle",
    label: "Fastest 400 km triangle",
    code: "400km △",
    group: "triangle",
    rule: speed("triangle", 400),
    record: { ...triangle500 },
    superseded: [
      {
        value: 81.0,
        distanceKm: 400.8,
        pilot: "John Bridge",
        turnpoints: ["WEC", "OSB", "DIS"],
        glider: "LS6c (17.5)",
        date: "2007-07-08",
        flightId: "11449",
      },
      { ...bridgeTriangle2007 },
      { ...jefferyTriangle2008a },
      { ...jefferyTriangle2008b },
    ],
    ukRecord: { status: "former", lists: ["UK Open"] },
  },
  {
    id: "fastest-400-or",
    label: "Fastest 400 km O/R",
    code: "400km O/R",
    group: "out-and-return",
    rule: speed("out-and-return", 400),
    record: {
      value: 122.9,
      distanceKm: 426.77,
      pilot: "Wendy Head",
      turnpoints: ["TAL"],
      glider: "ASG 29",
      date: "2022-08-14",
      flightId: "104588",
    },
    superseded: [
      // The 2023 doc gives "96.7 kph (102.5 actual)"; distance is not stated.
      {
        value: 102.5,
        pilot: "John Bridge",
        turnpoints: ["WBS"],
        glider: "LS6c (17.5)",
        date: "2004-08-07",
      },
    ],
  },
  {
    id: "fastest-300-triangle",
    label: "Fastest 300 km triangle",
    code: "300km △",
    group: "triangle",
    rule: speed("triangle", 300),
    record: { ...triangle300 },
    superseded: [
      {
        value: 69.8,
        distanceKm: 305.6,
        pilot: "John Bridge",
        turnpoints: ["SOH", "EAW", "CAL"],
        glider: "LS6c (17.5)",
        date: "2007-04-08",
        flightId: "10156",
      },
      {
        value: 80.7,
        distanceKm: 300.7,
        pilot: "John Bridge",
        turnpoints: ["DID", "LEI"],
        glider: "LS6c (17.5)",
        date: "2007-06-02",
        flightId: "11027",
      },
      { ...jefferyTriangle2007a },
      { ...jefferyTriangle2007b },
      { ...jefferyTriangle2008a },
      { ...jefferyTriangle2008b },
      { ...triangle500 },
    ],
  },
  {
    id: "fastest-300-or",
    label: "Fastest 300 km O/R",
    code: "300km O/R",
    group: "out-and-return",
    rule: speed("out-and-return", 300),
    record: { ...outAndReturn300 },
    // Records flown over at least 300 km in the other O/R categories.
    superseded: [
      { ...outAndReturn500 },
      { ...outAndReturnJeffery2010 },
      { ...outAndReturnBaker2013 },
    ],
  },
  {
    id: "fastest-200-triangle",
    label: "Fastest 200 km triangle",
    code: "200km △",
    group: "triangle",
    rule: speed("triangle", 200),
    record: { ...triangle300 },
    superseded: [
      {
        value: 81.2,
        distanceKm: 205.1,
        pilot: "John Bridge",
        turnpoints: ["BIC", "HUS"],
        glider: "LS6c (17.5)",
        date: "2007-04-07",
        flightId: "10155",
      },
      { ...jefferyTriangle2007a },
      { ...jefferyTriangle2007b },
      { ...jefferyTriangle2008a },
      { ...jefferyTriangle2008b },
      { ...triangle500 },
    ],
  },
  {
    id: "fastest-200-or",
    label: "Fastest 200 km O/R",
    code: "200km O/R",
    group: "out-and-return",
    rule: speed("out-and-return", 200),
    record: { ...outAndReturn300 },
    superseded: [
      { ...outAndReturnBirch1996 },
      { ...outAndReturnJeffery2010 },
      { ...outAndReturnBaker2013 },
    ],
  },
  {
    id: "fastest-100-triangle",
    label: "Fastest 100 km triangle",
    code: "100km △",
    group: "triangle",
    rule: speed("triangle", 100),
    record: {
      value: 134.0,
      distanceKm: 107.0,
      pilot: "Phil Jeffery",
      turnpoints: [{ name: "Molesworth" }, "OLN"],
      glider: "LS7-WL",
      date: "1995-08-01",
    },
    superseded: [],
    ukRecord: { status: "former", lists: ["UK Standard"] },
  },
  {
    id: "fastest-100-or",
    label: "Fastest 100 km O/R",
    code: "100km O/R",
    group: "out-and-return",
    rule: speed("out-and-return", 100),
    record: {
      value: 139.3,
      distanceKm: 101.48,
      pilot: "Iain Baker",
      turnpoints: ["COR"],
      glider: "Antares",
      date: "2015-05-16",
      flightId: "53036",
    },
    superseded: [
      { ...outAndReturnBirch1996 },
      { ...outAndReturnJeffery2010 },
      {
        value: 118.8,
        distanceKm: 105.8,
        pilot: "Iain Baker",
        turnpoints: ["NOS"],
        glider: "Antares",
        date: "2013-08-28",
        flightId: "44774",
      },
    ],
  },
  {
    id: "absolute-height",
    label: "Absolute altitude",
    code: "Absolute altitude",
    group: "height",
    rule: { kind: "height" },
    record: {
      value: 12992,
      pilot: "John Strzebrakowski",
      turnpoints: [],
      glider: "Skylark 3G",
      date: "1995-07-30",
    },
    superseded: [],
  },
  {
    id: "height-gain",
    label: "Gain of height",
    code: "Gain of height",
    group: "height",
    rule: { kind: "height" },
    record: {
      value: 11584,
      pilot: "John Strzebrakowski",
      turnpoints: [],
      glider: "Skylark 3G",
      date: "1995-07-30",
    },
    superseded: [],
  },
];

/**
 * The last season `scripts/club-records.ts` was run over and its candidates
 * reviewed. The script starts from this season (inclusive, as it may not have
 * been complete); bump it after each review.
 */
export const checkedThroughSeason = 2026;

export default categories;
