import CONFIG from "trophies-config";
import type {
  ClubConfig,
  ExcludedFlight,
  Flight,
  FlightTrophy,
  LadderResult,
  LadderTrophy,
  ScoredFlight,
  Trophy,
} from "../types";
import { ladderEval, ladderQualifyingFlights, trophyEval } from "./eval";
import { formatPilotName } from "./trophyCopyData";
import { resolveTrophy } from "./trophyHistory";

export type TrophyResults = (
  | { type: "ladder"; trophy: LadderTrophy; results: LadderResult[] }
  | { type: "flight"; trophy: FlightTrophy; results: ScoredFlight[] }
) & {
  /** Flights that would have counted for the trophy but are excluded. */
  excluded: ExcludedFlight[];
};

export interface SeasonFlights {
  /** The club's flights launched from the club site (used by flight trophies). */
  flights: Flight[];
  /** All of the club's flights, wherever launched (used by ladders). */
  allFlights: Flight[];
  /**
   * Every flight in the club's BGA download, including members' flights
   * filed under another club.
   */
  anyClubFlights: Flight[];
}

/** Split fetched flights into the club's flights and its home-site launches. */
export function selectSeasonFlights(
  fetched: Flight[],
  club: Pick<ClubConfig, "name" | "launchSite">,
): SeasonFlights {
  const allFlights = fetched.filter((f) => f.clubName === club.name);
  const flights = allFlights.filter(
    (f) => f.task.launchSite === club.launchSite,
  );
  return { flights, allFlights, anyClubFlights: fetched };
}

/**
 * Score a trophy for a season. Resolves the trophy's season-scoped history
 * first, so callers may pass either a raw or an already-resolved trophy.
 */
export function evaluateTrophy(
  trophy: Trophy,
  season: number,
  { flights, allFlights }: Pick<SeasonFlights, "flights" | "allFlights">,
): TrophyResults {
  const resolved = resolveTrophy(trophy, season);
  const { excludedFlights = {}, pilotMilestones } = CONFIG;
  if (resolved.type === "ladder") {
    const excluded = ladderQualifyingFlights(
      CONFIG.season,
      season,
      allFlights,
      resolved,
      pilotMilestones,
    )
      .filter((f) => excludedFlights[f.id])
      .map((f) => ({
        ...f,
        score: { value: f.task.crossCountryPoints, unit: "pts" },
        exclude: excludedFlights[f.id],
      }));
    return {
      type: "ladder",
      trophy: resolved,
      results: ladderEval(
        CONFIG.season,
        season,
        allFlights,
        resolved,
        pilotMilestones,
        excludedFlights,
      ),
      excluded,
    };
  }
  const scored = trophyEval(
    CONFIG.season,
    season,
    flights,
    resolved,
    pilotMilestones,
    excludedFlights,
  );
  return {
    type: "flight",
    trophy: resolved,
    results: scored.filter((f) => !f.exclude),
    excluded: scored.filter((f): f is ExcludedFlight => !!f.exclude),
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
