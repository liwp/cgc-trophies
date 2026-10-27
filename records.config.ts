/**
 * Cambridge Gliding Centre club records.
 *
 * Sources: the 2023 club records document (the baseline, below) and Alex
 * Holswilder's unverified "Proposed Revision" of 11 July 2026 (not merged).
 * Speeds are actual speeds. Records approved on 2026-10-27 from the ladder
 * (FAI SC3 rules) replace the baseline, which is kept in `superseded`.
 * Candidate new records come from
 * `scripts/club-records.ts`, which never edits this file; update it by hand.
 */
import type { ClubRecord, RecordCategory, RecordRule } from "./src/types";

const triangle500: ClubRecord = {
  value: 116.6,
  distanceKm: 515.25,
  pilot: "Phil Jeffery",
  route: "Bicester – Scunthorpe N – Garboldisham",
  glider: "Ventus 2cxt",
  date: "2010-04-22",
};

// Phil Jeffery's 2014 triangle holds both the 300 and 200 km triangle records.
const triangle300: ClubRecord = {
  value: 120.2,
  distanceKm: 305.59,
  pilot: "Phil Jeffery",
  route: "Calvert Rail Junction – Eastwell – Soham",
  glider: "Ventus 2cx",
  date: "2014-07-29",
  flightId: "49654",
};

// Graham Drury's 2022 O/R holds both the 300 and 200 km O/R records.
const outAndReturn300: ClubRecord = {
  value: 133.9,
  distanceKm: 302.51,
  pilot: "Graham Drury",
  route: "Great Malvern",
  glider: "ASW 27B",
  date: "2022-08-14",
  flightId: "104680",
};

const speed = (
  shape: "any" | "triangle" | "out-and-return",
  minDistanceKm: number,
): RecordRule => ({ kind: "speed", shape, minDistanceKm });

const categories: RecordCategory[] = [
  {
    id: "longest-distance",
    label: "Longest distance (up to 3 TPs)",
    rule: { kind: "distance", shape: "any", maxTurnpoints: 3 },
    record: {
      value: 981.68,
      pilot: "Phil Jones",
      route: "Bruton – Tibenham – Halesland",
      glider: "Ventus 2cx",
      date: "2004-05-22",
    },
    superseded: [],
  },
  {
    id: "largest-triangle",
    label: "Largest triangle",
    rule: { kind: "distance", shape: "triangle" },
    record: {
      value: 762.8,
      pilot: "Mike Young",
      route: "Bruton – Whitchurch – Tibenham",
      glider: "LS8",
      date: "2002-05-19",
    },
    superseded: [],
  },
  {
    id: "fastest-750",
    label: "Fastest 750 km",
    rule: speed("any", 750),
    record: {
      value: 99.0,
      distanceKm: 767.16,
      pilot: "Robert Welford",
      route: "Sheffield West – Colchester – Chesterfield",
      glider: "ASG 29",
      date: "2018-06-21",
      flightId: "71348",
    },
    superseded: [
      {
        value: 89.5,
        distanceKm: 766.8,
        pilot: "John Bridge",
        route: "Frome – Thetford – Swindon South",
        glider: "LS6c (17.5)",
        date: "1998-07-25",
      },
    ],
  },
  {
    id: "fastest-600-triangle",
    label: "Fastest 600 km triangle",
    rule: speed("triangle", 600),
    record: {
      value: 98.8,
      distanceKm: 600.71,
      pilot: "Phil Jeffery",
      route: "Talgarth – Barnsley W",
      glider: "Ventus 3",
      date: "2022-08-05",
      flightId: "103757",
    },
    superseded: [
      {
        value: 96.9,
        distanceKm: 607.46,
        pilot: "Phil Jeffery",
        route: "Ross-on-Wye – Ladybower Reservoir – Bury St Edmunds N",
        glider: "Ventus 2cxt",
        date: "2011-06-14",
      },
    ],
  },
  {
    id: "fastest-600-or",
    label: "Fastest 600 km O/R",
    rule: speed("out-and-return", 600),
    record: null,
    superseded: [],
  },
  {
    id: "fastest-500-triangle",
    label: "Fastest 500 km triangle",
    rule: speed("triangle", 500),
    record: { ...triangle500 },
    superseded: [],
    ukRecord: { status: "former", lists: ["UK Open"] },
  },
  {
    id: "fastest-500-or",
    label: "Fastest 500 km O/R",
    rule: speed("out-and-return", 500),
    record: {
      value: 106.89,
      distanceKm: 509.7,
      pilot: "Sarah Kelman",
      route: "Northallerton",
      glider: "ASW 28",
      date: "2003-08-14",
    },
    superseded: [],
    ukRecord: { status: "current", lists: ["UK Standard", "UK Feminine Open"] },
  },
  {
    id: "fastest-400-triangle",
    label: "Fastest 400 km triangle",
    rule: speed("triangle", 400),
    record: { ...triangle500 },
    superseded: [],
    ukRecord: { status: "former", lists: ["UK Open"] },
  },
  {
    id: "fastest-400-or",
    label: "Fastest 400 km O/R",
    rule: speed("out-and-return", 400),
    record: {
      value: 122.9,
      distanceKm: 426.77,
      pilot: "Wendy Head",
      route: "Talgarth",
      glider: "ASG 29",
      date: "2022-08-14",
      flightId: "104588",
    },
    superseded: [
      // The 2023 doc gives "96.7 kph (102.5 actual)"; distance is not stated.
      {
        value: 102.5,
        pilot: "John Bridge",
        route: "Wetherby South",
        glider: "LS6c (17.5)",
        date: "2004-08-07",
      },
    ],
  },
  {
    id: "fastest-300-triangle",
    label: "Fastest 300 km triangle",
    rule: speed("triangle", 300),
    record: { ...triangle300 },
    superseded: [{ ...triangle500 }],
  },
  {
    id: "fastest-300-or",
    label: "Fastest 300 km O/R",
    rule: speed("out-and-return", 300),
    record: { ...outAndReturn300 },
    superseded: [],
  },
  {
    id: "fastest-200-triangle",
    label: "Fastest 200 km triangle",
    rule: speed("triangle", 200),
    record: { ...triangle300 },
    superseded: [{ ...triangle500 }],
  },
  {
    id: "fastest-200-or",
    label: "Fastest 200 km O/R",
    rule: speed("out-and-return", 200),
    record: { ...outAndReturn300 },
    superseded: [
      {
        value: 109.0,
        distanceKm: 221.6,
        pilot: "John Birch",
        route: "Newark",
        glider: "LS8",
        date: "1996-08-19",
      },
      {
        value: 110.9,
        distanceKm: 302.5,
        pilot: "Phil Jeffery",
        route: "Great Malvern",
        glider: "Ventus 2cx",
        date: "2010-08-31",
        flightId: "29151",
      },
      {
        value: 118.3,
        distanceKm: 302.5,
        pilot: "Iain Baker",
        route: "Great Malvern",
        glider: "Antares",
        date: "2013-08-31",
        flightId: "44883",
      },
    ],
  },
  {
    id: "fastest-100-triangle",
    label: "Fastest 100 km triangle",
    rule: speed("triangle", 100),
    record: {
      value: 134.0,
      distanceKm: 107.0,
      pilot: "Phil Jeffery",
      route: "Molesworth – Olney",
      glider: "LS7-WL",
      date: "1995-08-01",
    },
    superseded: [],
    ukRecord: { status: "former", lists: ["UK Standard"] },
  },
  {
    id: "fastest-100-or",
    label: "Fastest 100 km O/R",
    rule: speed("out-and-return", 100),
    record: {
      value: 139.3,
      distanceKm: 101.48,
      pilot: "Iain Baker",
      route: "Corby",
      glider: "Antares",
      date: "2015-05-16",
      flightId: "53036",
    },
    superseded: [
      {
        value: 118.8,
        distanceKm: 105.8,
        pilot: "Iain Baker",
        route: "Northampton South",
        glider: "Antares",
        date: "2013-08-28",
        flightId: "44774",
      },
    ],
  },
  {
    id: "absolute-height",
    label: "Absolute height",
    rule: { kind: "height" },
    record: {
      value: 12992,
      pilot: "John Strzebrakowski",
      route: "",
      glider: "Skylark 3G",
      date: "1995-07-30",
    },
    superseded: [],
  },
  {
    id: "height-gain",
    label: "Height gain",
    rule: { kind: "height" },
    record: {
      value: 11584,
      pilot: "John Strzebrakowski",
      route: "",
      glider: "Skylark 3G",
      date: "1995-07-30",
    },
    superseded: [],
  },
];

export default categories;
