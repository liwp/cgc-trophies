import { sumBy } from "lodash";
import type { Flight, SeasonConfig } from "../types";
import { inSeasonPredicate } from "./eval";

interface CategoryStat {
  completed: number;
  total: number;
  percentage: number;
}

const categories = [
  {
    key: "open",
    pred: () => true,
  },
  {
    key: "300km",
    pred: ({ task: { taskDistanceKm } }: Flight) =>
      300 <= taskDistanceKm && taskDistanceKm < 400,
  },
  {
    key: "400km",
    pred: ({ task: { taskDistanceKm } }: Flight) =>
      400 <= taskDistanceKm && taskDistanceKm < 500,
  },
  {
    key: "500km",
    pred: ({ task: { taskDistanceKm } }: Flight) =>
      500 <= taskDistanceKm && taskDistanceKm < 750,
  },
  {
    key: "750km",
    pred: ({ task: { taskDistanceKm } }: Flight) => 750 <= taskDistanceKm,
  },
];

function updateCategory(
  stats: CategoryStat | undefined,
  flight: Flight,
): CategoryStat {
  const { isCompleted = false, isDeclared = false } = flight.task || {};
  let { completed, total } = stats || { total: 0, completed: 0, percentage: 0 };

  if (isCompleted && isDeclared) {
    completed += 1;
  }
  total += 1;

  return {
    ...stats,
    completed,
    total,
    percentage: (100 * completed) / total,
  };
}

function updateStats(prevStats: Record<string, CategoryStat>, flight: Flight) {
  if (flight.task.claimType !== "C") {
    return prevStats;
  }

  const nextStats = { ...prevStats };
  categories
    .filter(({ pred }) => pred(flight as any))
    .forEach(({ key }) => {
      nextStats[key] = updateCategory(nextStats[key], flight);
    });

  return nextStats;
}

function calculateStats(flights: Flight[]) {
  return flights.reduce(updateStats, {});
}

export interface SeasonSummary {
  flights: number;
  pilots: number;
  gliders: number;
  scoringKm: number;
  points: number;
  completed: number;
  /** Percentage of flights with a declared task (0 when there are none). */
  declaredPct: number;
}

/**
 * Club totals for one season's claimed ("C") flights. Completed counts
 * declared, completed tasks, as in the distance categories above.
 */
function seasonSummary(
  flights: Flight[],
  season: number,
  seasonConfig: SeasonConfig,
): SeasonSummary {
  const inSeason = inSeasonPredicate(season, seasonConfig);
  const claimed = flights.filter(
    (f) => f.task.claimType === "C" && inSeason(f),
  );
  const count = (pred: (f: Flight) => boolean) => claimed.filter(pred).length;
  return {
    flights: claimed.length,
    pilots: new Set(claimed.map((f) => f.pilot)).size,
    gliders: new Set(claimed.map((f) => f.glider.registration)).size,
    scoringKm: sumBy(claimed, (f) => f.task.scoringDistanceKm),
    points: sumBy(claimed, (f) => f.task.crossCountryPoints),
    completed: count((f) => f.task.isCompleted && f.task.isDeclared),
    declaredPct: claimed.length
      ? (100 * count((f) => f.task.isDeclared)) / claimed.length
      : 0,
  };
}

export {
  calculateStats,
  categories,
  seasonSummary,
  updateCategory,
  updateStats,
};
