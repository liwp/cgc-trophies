import _ from "lodash";

const { chain, get, isEqual, isFunction, reverse } = _;
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  LadderResult,
  SeasonConfig,
  ScoredFlight,
  TrophyConfig,
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

/**
 * defaultConfig: {season: ..., exclude: ...}
 * trophy: {season: ..., exclude: ..., include: ...}
 *
 * where
 * season: {start: {month: ..., day: ...}, end: {month: ..., day: ...}}
 * exclude: {<id>: "<reason>"} (a set of ignored flights)
 * include: {<id>: "<reason>"} (a set of included flights)
 *
 * Some flights are either ignored, eg airspace issues or pilot doesn't qualify
 * for the trophy, and others are included, eg the use of an extra navigational
 * TP
 */
export function trophyEval(
  defaultConfig: TrophyConfig,
  season: number,
  flights: Flight[],
  trophy: FlightTrophy,
): ScoredFlight[] {
  const inSeason = inSeasonPredicate(
    season,
    trophy.season || defaultConfig.season,
  );

  const excludedIds: Record<string, string> = {
    ...defaultConfig.exclude,
    ...trophy.exclude,
  };
  const includedIds: Record<string, string> = trophy.include || {};

  let chain_ = chain(flights)
    .filter(inSeason)
    .map((flight) => ({
      ...flight,
      exclude: excludedIds[flight.id],
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

export function ladderEval(
  defaultConfig: TrophyConfig,
  season: number,
  flights: Flight[],
  trophy: LadderTrophy,
): LadderResult[] {
  const inSeason = inSeasonPredicate(season, defaultConfig.season);

  // 1. Filter to in-season flights qualifying for this ladder
  const qualifying = flights
    .filter(inSeason)
    .filter((f) => f.ladders.includes(trophy.ladderKey));

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

  // 3. Per group: sort by crossCountryPoints desc, take top N
  const results: LadderResult[] = [];
  for (const [key, groupFlights] of groups) {
    const sorted = [...groupFlights].sort(
      (a, b) => b.task.crossCountryPoints - a.task.crossCountryPoints,
    );
    const topFlights = sorted.slice(0, trophy.topN);
    const totalScore = topFlights.reduce(
      (sum, f) => sum + f.task.crossCountryPoints,
      0,
    );
    const pilots = [...new Set(topFlights.map((f) => f.pilot))];

    // 5. For Syndicate: filter groups with < minPilots unique pilots
    if (trophy.minPilots && pilots.length < trophy.minPilots) {
      continue;
    }

    results.push({ key, totalScore, pilots, flights: topFlights });
  }

  // 6. Sort groups by totalScore descending
  results.sort((a, b) => b.totalScore - a.totalScore);

  return results;
}
