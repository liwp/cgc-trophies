import type { Flight } from "../types";

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

export { calculateStats, categories, updateCategory, updateStats };
