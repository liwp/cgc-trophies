import { drop, dropRight, zipWith } from "lodash";
import wgs84util from "wgs84-util";
import type { Flight } from "../types";

function tpDistance(
  tp1: { lon: number; lat: number },
  tp2: { lon: number; lat: number },
): number {
  return (
    wgs84util.distanceBetween(
      {
        type: "Point",
        coordinates: [tp1.lon, tp1.lat],
      },
      {
        type: "Point",
        coordinates: [tp2.lon, tp2.lat],
      },
    ) / 1000
  );
}

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
    key: "weekend",
    pred: (flight: any) => flight.weekendLadder,
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

function updateAttemptedDistance(
  stats: { attemptedKm: number },
  { task: { tps, scoringDistanceKm } }: any,
) {
  let { attemptedKm } = stats;

  if (!tps || tps.some(({ id }: { id: string }) => id[0] === "*")) {
    attemptedKm += scoringDistanceKm;
  } else {
    attemptedKm += zipWith(dropRight(tps, 1), drop(tps, 1), tpDistance).reduce(
      (sum: number, x: number) => sum + x,
      0,
    );
  }

  return {
    ...stats,
    attemptedKm,
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

export {
  calculateStats,
  categories,
  updateAttemptedDistance,
  updateCategory,
  updateStats,
};
