import CONFIG from "trophies-config";
import type {
  Flight,
  FlightTrophy,
  LadderResult,
  LadderTrophy,
  ScoredFlight,
  Trophy,
} from "../types";
import { ladderEval, trophyEval } from "./eval";
import { formatPilotName } from "./trophyCopyData";
import { resolveTrophy } from "./trophyHistory";

export type TrophyResults =
  | { type: "ladder"; trophy: LadderTrophy; results: LadderResult[] }
  | { type: "flight"; trophy: FlightTrophy; results: ScoredFlight[] };

export interface SeasonFlights {
  /** The club's flights launched from the club site (used by flight trophies). */
  flights: Flight[];
  /** All of the club's flights, wherever launched (used by ladders). */
  allFlights: Flight[];
}

/**
 * Score a trophy for a season. Resolves the trophy's season-scoped history
 * first, so callers may pass either a raw or an already-resolved trophy.
 */
export function evaluateTrophy(
  trophy: Trophy,
  season: number,
  { flights, allFlights }: SeasonFlights,
): TrophyResults {
  const resolved = resolveTrophy(trophy, season);
  if (resolved.type === "ladder") {
    return {
      type: "ladder",
      trophy: resolved,
      results: ladderEval(
        CONFIG.season,
        season,
        allFlights,
        resolved,
        CONFIG.pilotMilestones,
      ),
    };
  }
  return {
    type: "flight",
    trophy: resolved,
    results: trophyEval(
      CONFIG.season,
      season,
      flights,
      resolved,
      CONFIG.pilotMilestones,
    ),
  };
}

/** "512.3 km", "87.6 kph", "1234 pts". */
export function formatScore({
  value,
  unit,
}: {
  value: number;
  unit: string;
}): string {
  return `${value.toFixed(unit === "pts" ? 0 : 1)} ${unit}`;
}

/** The winner's display name, or undefined when nothing qualified. */
export function winnerName(evaluated: TrophyResults): string | undefined {
  if (evaluated.type === "ladder") {
    const [winner] = evaluated.results;
    if (!winner) return undefined;
    return evaluated.trophy.groupBy === "registration"
      ? `${winner.key} (${winner.pilots.map(formatPilotName).join(", ")})`
      : formatPilotName(winner.key);
  }
  const [winner] = evaluated.results;
  return winner && formatPilotName(winner.pilot);
}

/** The winner's formatted score, or undefined when nothing qualified. */
export function winnerScore(evaluated: TrophyResults): string | undefined {
  if (evaluated.type === "ladder") {
    const [winner] = evaluated.results;
    return winner && formatScore({ value: winner.totalScore, unit: "pts" });
  }
  const [winner] = evaluated.results;
  return winner && formatScore(winner.score);
}

/** The flights that make up the winning result (none when nothing qualified). */
export function winnerFlights(evaluated: TrophyResults): Flight[] {
  if (evaluated.type === "ladder") {
    return evaluated.results[0]?.flights ?? [];
  }
  const [winner] = evaluated.results;
  return winner ? [winner] : [];
}
