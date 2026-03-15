import _ from "lodash";

const { chain, get, isEqual, isFunction, reverse } = _;
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  LadderResult,
  PilotMilestones,
  SeasonConfig,
  ScoredFlight,
} from "../types";

type Comparator = (x: any, y: any) => boolean;

const comparators: Record<string, Comparator> = {
  "=": (x, y) => x === y,
  "<=": (x, y) => x <= y,
  "<=>": (xs, ys) => isEqual(xs, [...ys].reverse()) || isEqual(xs, ys),
};

function configToDate(
  season: number,
  { day, month }: { day: number; month: number },
): Date {
  return new Date(`${season}-${month}-${day}`);
}

function inSeasonPredicate(
  season: number,
  config: SeasonConfig,
): (flight: { date: Date }) => boolean {
  const start = configToDate(season, config.start);
  const end = configToDate(season, config.end);

  if (start > end) {
    end.setFullYear(end.getFullYear() + 1);
  }

  return ({ date }) => {
    const flight = new Date(date);
    return start < flight && flight < end;
  };
}

export function milestoneExcludedPilots(
  pilotMilestones: PilotMilestones | undefined,
  milestone: string | undefined,
  season: number,
): Set<string> {
  if (!pilotMilestones || !milestone) return new Set();
  const milestoneMap = pilotMilestones[milestone] || {};
  const excluded = new Set<string>();
  for (const [pilot, year] of Object.entries(milestoneMap)) {
    if (year === 0 || year < season) {
      excluded.add(pilot);
    }
  }
  return excluded;
}

export function trophyEval(
  defaultSeason: SeasonConfig,
  season: number,
  flights: Flight[],
  trophy: FlightTrophy,
  pilotMilestones?: PilotMilestones,
): ScoredFlight[] {
  const inSeason = inSeasonPredicate(
    season,
    trophy.season || defaultSeason,
  );

  const excludedIds: Record<string, string> = {
    ...trophy.exclude,
  };
  const includedIds: Record<string, string> = trophy.include || {};
  const excludedPilots = milestoneExcludedPilots(
    pilotMilestones,
    trophy.excludePilotsWithMilestone,
    season,
  );

  let chain_ = chain(flights)
    .filter(inSeason)
    .map((flight) => ({
      ...flight,
      exclude:
        excludedIds[flight.id] ||
        (excludedPilots.has(flight.pilot)
          ? `${trophy.excludePilotsWithMilestone} milestone`
          : undefined),
      include: includedIds[flight.id],
    }));

  trophy.expr.forEach(([op, ...args]: [string, ...any[]]) => {
    switch (op) {
      case "filter": {
        const [field, comparator = "=", value = true] = args;
        const pred = comparators[comparator];
        if (!pred) {
          throw new Error(
            `Unknown filter predicate: ${comparator} in ${op} ${args}`,
          );
        }
        chain_ = chain_.filter((flight: any) => {
          if (!!flight.exclude) {
            console.log(`flight excluded - ${flight.id}: ${flight.exclude}`);
            return false;
          } else if (!!flight.include) {
            return true;
          } else {
            return pred(get(flight, field), value);
          }
        });
        break;
      }
      case "project": {
        const [field, fieldsOfProjection] = args;
        const projection = isFunction(fieldsOfProjection)
          ? fieldsOfProjection
          : (f: any) => fieldsOfProjection.map((key: string) => get(f, key));
        chain_ = chain_.map((f: any) =>
          Object.assign({}, f, { [field]: projection(f) }),
        );
        break;
      }
      case "score": {
        const [field, unit] = args;
        chain_ = chain_.map((f: any) =>
          Object.assign({}, f, { score: { value: get(f, field), unit } }),
        );
      }
      case "sort": {
        const [field, order] = args;
        chain_ = chain_.orderBy(field, order);
        break;
      }
      default:
        throw new Error(`Unknown op: ${op} ${args}`);
    }
  });

  return chain_
    .map((flight: any) => {
      if (!!flight.include) {
        console.log(`flight included - ${flight.id}: ${flight.include}`);
      }
      return flight;
    })
    .value() as ScoredFlight[];
}

/**
 * Select the top N flights by crossCountryPoints, ensuring at least
 * 2 distinct pilots are represented. If the best N flights are all
 * from one pilot, the lowest-scoring flight is swapped with the best
 * available flight from another pilot.
 *
 * Returns null if fewer than 2 pilots have flights.
 */
function selectTopFlightsMultiPilot(
  sorted: Flight[],
  topN: number,
): Flight[] | null {
  const selected = sorted.slice(0, topN);
  const pilots = new Set(selected.map((f) => f.pilot));

  if (pilots.size >= 2) return selected;

  const candidate = sorted.slice(topN).find((f) => !pilots.has(f.pilot));
  if (!candidate) return null;

  selected[selected.length - 1] = candidate;
  return selected;
}

export function ladderEval(
  defaultSeason: SeasonConfig,
  season: number,
  flights: Flight[],
  trophy: LadderTrophy,
  pilotMilestones?: PilotMilestones,
): LadderResult[] {
  const inSeason = inSeasonPredicate(season, defaultSeason);
  const excludedPilots = milestoneExcludedPilots(
    pilotMilestones,
    trophy.excludePilotsWithMilestone,
    season,
  );

  // 1. Filter to in-season flights qualifying for this ladder
  const qualifying = flights
    .filter(inSeason)
    .filter((f) => f.ladders.includes(trophy.ladderKey))
    .filter((f) => !excludedPilots.has(f.pilot))
    .filter((f) => {
      if (!trophy.gliderFilter) return true;
      return trophy.gliderFilter.some((pattern) =>
        new RegExp(pattern, "i").test(f.glider.type),
      );
    });

  // 2. Group by pilot or glider registration
  const groups = new Map<string, Flight[]>();
  for (const flight of qualifying) {
    const key =
      trophy.groupBy === "registration"
        ? flight.glider.registration
        : flight.pilot;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(flight);
  }

  // 3. Per group: sort by crossCountryPoints desc, select top N
  const results: LadderResult[] = [];
  for (const [key, groupFlights] of groups) {
    const sorted = [...groupFlights].sort(
      (a, b) => b.task.crossCountryPoints - a.task.crossCountryPoints,
    );

    const topFlights = trophy.groupBy === "registration"
      ? selectTopFlightsMultiPilot(sorted, trophy.topN)
      : sorted.slice(0, trophy.topN);

    if (!topFlights) continue;

    const totalScore = topFlights.reduce(
      (sum, f) => sum + f.task.crossCountryPoints,
      0,
    );
    const totalDistance = topFlights.reduce(
      (sum, f) => sum + f.task.scoringDistanceKm,
      0,
    );
    const pilots = [...new Set(topFlights.map((f) => f.pilot))];

    results.push({ key, totalScore, totalDistance, pilots, flights: topFlights });
  }

  // 4. Sort groups by totalScore descending
  results.sort((a, b) => b.totalScore - a.totalScore);

  return results;
}
