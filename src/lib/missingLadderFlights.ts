import { groupBy } from "lodash";
import type {
  ExcludedFlights,
  Flight,
  LadderTrophy,
  PilotMilestones,
  SeasonConfig,
} from "../types";
import { ladderEval, ladderQualifyingFlights } from "./eval";
import type { SeasonFlights } from "./results";

export interface MissingLadderFlights {
  pilot: string;
  /** The pilot's ladder total as entered. */
  currentScore: number;
  /** The total if the missing flights were added to the ladder. */
  potentialScore: number;
  /** Open Ladder flights not entered on the trophy's ladder, best first. */
  flights: Flight[];
}

/**
 * Pilots eligible for a club ladder trophy (e.g. novices on the Fastrackers
 * ladder) whose season has Open Ladder flights not entered on that ladder,
 * with the total they would reach if they were. Members' flights filed under
 * another club count as missing: their ladder flags are that club's ladders.
 */
export function missingLadderFlights(
  defaultSeason: SeasonConfig,
  season: number,
  {
    allFlights,
    anyClubFlights,
  }: Pick<SeasonFlights, "allFlights" | "anyClubFlights">,
  trophy: LadderTrophy,
  pilotMilestones?: PilotMilestones,
  excludedFlights: ExcludedFlights = {},
): MissingLadderFlights[] {
  const clubIds = new Set(allFlights.map((f) => f.id));
  const openTrophy = { ...trophy, ladderKey: "open" };
  const missing = ladderQualifyingFlights(
    defaultSeason,
    season,
    anyClubFlights,
    openTrophy,
    pilotMilestones,
  ).filter(
    (f) =>
      !(clubIds.has(f.id) && f.ladders.includes(trophy.ladderKey)) &&
      !excludedFlights[f.id],
  );
  if (missing.length === 0) return [];

  const score = (scored: Flight[]) =>
    new Map(
      ladderEval(
        defaultSeason,
        season,
        scored,
        trophy,
        pilotMilestones,
        excludedFlights,
      ).map((r) => [r.key, r.totalScore]),
    );
  const current = score(allFlights);
  const missingIds = new Set(missing.map((f) => f.id));
  const potential = score([
    ...allFlights.filter((f) => !missingIds.has(f.id)),
    ...missing.map((f) => ({ ...f, ladders: [trophy.ladderKey] })),
  ]);

  return Object.entries(groupBy(missing, (f) => f.pilot))
    .map(([pilot, pilotFlights]) => ({
      pilot,
      currentScore: current.get(pilot) ?? 0,
      potentialScore: potential.get(pilot) ?? 0,
      flights: pilotFlights.sort(
        (a, b) => b.task.crossCountryPoints - a.task.crossCountryPoints,
      ),
    }))
    .sort((a, b) => b.potentialScore - a.potentialScore);
}
