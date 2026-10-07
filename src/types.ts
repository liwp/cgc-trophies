export interface Flight {
  id: string;
  date: Date;
  clubName: string;
  pilot: string;
  glider: { type: string; handicap: number; registration: string };
  ladders: string[];
  task: {
    claimType: string;
    isCompleted: boolean;
    crossCountryPoints: number;
    isDeclared: boolean;
    scoringDistanceKm: number;
    taskDistanceKm: number;
    taskAchievement: string;
    handicappedDistanceKm: number;
    handicappedSpeedKph: number;
    launchSite: string;
    start: string;
    finish: string;
    turnpoints: string[];
    heightLoss: number;
  };
}

export interface SeasonConfig {
  start: { month: number; day: number };
  end: { month: number; day: number };
}

export interface ClubConfig {
  name: string;
  shortName: string;
  code: string;
  launchSite: string;
}

// --- Flight trophy DSL ------------------------------------------------------
// A flight trophy's `expr` is a pipeline of [op, ...args] tuples (see
// trophies.config.ts for the documentation). Field paths are derived from
// Flight, so a typo or a comparator/value of the wrong type is a compile error.

// Dotted paths to Flight's leaf values; arrays also expose `.length`.
type PathsOf<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends readonly unknown[]
    ? `${Prefix}${K}` | `${Prefix}${K}.length`
    : T[K] extends Date
      ? `${Prefix}${K}`
      : T[K] extends object
        ? PathsOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
}[keyof T & string];

type ValueAt<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? ValueAt<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export type FlightField = PathsOf<Flight>;
export type FlightValue<P extends FlightField> = ValueAt<Flight, P>;

type FieldsOfType<V> = {
  [P in FlightField]: FlightValue<P> extends V ? P : never;
}[FlightField];

export type ScoreUnit = "km" | "kph" | "pts";

export type FilterExpr =
  // Keep flights where the boolean field is true.
  | ["filter", FieldsOfType<boolean>]
  // Keep flights where the field equals the value.
  | { [P in FlightField]: ["filter", P, "=", FlightValue<P>] }[FlightField]
  | ["filter", FieldsOfType<number>, "<=", number]
  // Array equality in either direction (reversible routes, e.g. BUG-MEN).
  | ["filter", FieldsOfType<string[]>, "<=>", string[]];

export type ScoreExpr = ["score", FieldsOfType<number>, ScoreUnit];

export type SortExpr = [
  "sort",
  "score.value" | FieldsOfType<number>,
  "asc" | "desc",
];

export type TrophyExpr = FilterExpr | ScoreExpr | SortExpr;

export interface TrophyVersion
  extends Required<Pick<FlightTrophy, "description" | "expr">> {
  /** Inclusive: this version applied through this season (e.g. `untilSeason: 2025`
   *  means it was in force through the 2025 season and superseded from 2026). */
  untilSeason: number;
}

export interface FlightTrophy {
  id: string;
  type?: "flight";
  name: string;
  description: string;
  img?: string[];
  expr: TrophyExpr[];
  history?: TrophyVersion[];
  season?: SeasonConfig;
  exclude?: Record<string, string>;
  include?: Record<string, string>;
  excludePilotsWithMilestone?: string;
}

export interface LadderTrophy {
  id: string;
  type: "ladder";
  name: string;
  description: string;
  img?: string[];
  ladderKey: string;
  groupBy: "pilot" | "registration";
  topN: number;
  gliderFilter?: string[];
  excludePilotsWithMilestone?: string;
}

export type PilotMilestones = Record<string, Record<string, number>>;

export type Trophy = FlightTrophy | LadderTrophy;

export interface ScoredFlight extends Flight {
  score: { value: number; unit: string };
  exclude?: string;
  include?: string;
}

export interface LadderResult {
  key: string;
  totalScore: number;
  totalDistance: number;
  pilots: string[];
  flights: Flight[];
}

export interface IgcTrackPoint {
  time: string;
  lat: number;
  lon: number;
  baroAlt: number;
  gpsAlt: number;
}

export interface IgcTaskPoint {
  lat: number;
  lon: number;
  name: string;
}

export interface IgcData {
  task: IgcTaskPoint[];
  track: IgcTrackPoint[];
}

export interface HeightLossResult {
  startAltitude: number;
  finishAltitude: number;
  heightLoss: number;
}

export interface TrophiesConfig {
  club: ClubConfig;
  season: SeasonConfig;
  pilotMilestones?: PilotMilestones;
  trophies: Trophy[];
}
