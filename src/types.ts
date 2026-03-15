export interface Flight {
  id: string;
  date: Date;
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
    tps?: { id: string; lat: number; lon: number }[];
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

export interface FlightTrophy {
  id: string;
  type?: "flight";
  name: string;
  description: string;
  img?: string[];
  expr: any[][];
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
