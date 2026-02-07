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
    handicappedDistanceKm: number;
    handicappedSpeedKph: number;
    launchSite: string;
    start: string;
    finish: string;
    turnpoints: string[];
    tps?: { id: string; lat: number; lon: number }[];
  };
}

export interface SeasonConfig {
  start: { month: number; day: number };
  end: { month: number; day: number };
}

export interface TrophyConfig {
  default: string;
  exclude: Record<string, string>;
  season: SeasonConfig;
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
  minPilots?: number;
}

export type Trophy = FlightTrophy | LadderTrophy;

export interface ScoredFlight extends Flight {
  score: { value: number; unit: string };
  exclude?: string;
  include?: string;
}

export interface LadderResult {
  key: string;
  totalScore: number;
  pilots: string[];
  flights: Flight[];
}

export interface TrophiesConfig {
  config: TrophyConfig;
  trophies: Trophy[];
}
