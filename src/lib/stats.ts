import { groupBy, meanBy, orderBy, sortBy, sumBy, uniq } from "lodash";
import type { Flight, SeasonConfig, TaskShape } from "../types";
import { inSeasonPredicate } from "./eval";
import { formatPilotName } from "./trophyCopyData";

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
    key: "under300km",
    pred: ({ task: { taskDistanceKm } }: Flight) => taskDistanceKm < 300,
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
      500 <= taskDistanceKm && taskDistanceKm < 600,
  },
  {
    key: "600km",
    pred: ({ task: { taskDistanceKm } }: Flight) =>
      600 <= taskDistanceKm && taskDistanceKm < 750,
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

/** A season's claimed ("C") flights, the ones the stats page counts. */
function claimedInSeason(
  flights: Flight[],
  season: number,
  seasonConfig: SeasonConfig,
): Flight[] {
  const inSeason = inSeasonPredicate(season, seasonConfig);
  return flights.filter((f) => f.task.claimType === "C" && inSeason(f));
}

const isCompletedTask = (f: Flight) => f.task.isCompleted && f.task.isDeclared;

/**
 * Club totals for one season's claimed ("C") flights. Completed counts
 * declared, completed tasks, as in the distance categories above.
 */
function seasonSummary(
  flights: Flight[],
  season: number,
  seasonConfig: SeasonConfig,
): SeasonSummary {
  const claimed = claimedInSeason(flights, season, seasonConfig);
  const count = (pred: (f: Flight) => boolean) => claimed.filter(pred).length;
  return {
    flights: claimed.length,
    pilots: new Set(claimed.map((f) => f.pilot)).size,
    gliders: new Set(claimed.map((f) => f.glider.registration)).size,
    scoringKm: sumBy(claimed, (f) => f.task.scoringDistanceKm),
    points: sumBy(claimed, (f) => f.task.crossCountryPoints),
    completed: count(isCompletedTask),
    declaredPct: claimed.length
      ? (100 * count((f) => f.task.isDeclared)) / claimed.length
      : 0,
  };
}

export interface PilotStats {
  pilot: string;
  flights: number;
  scoringKm: number;
  points: number;
  bestKm: number;
  bestPoints: number;
  /** Declared, completed tasks. */
  completed: number;
  /** Percentage of flights that were declared, completed tasks. */
  completionPct: number;
  /** Mean handicapped speed of completed tasks; null without any. */
  avgSpeedKph: number | null;
  /** Completed tasks of at least 300 and 500 km. */
  completed300: number;
  completed500: number;
  /** Registrations flown, in order of first flight. */
  gliders: string[];
}

/** Per-pilot totals for a season's claimed flights, most points first. */
function pilotStats(
  flights: Flight[],
  season: number,
  seasonConfig: SeasonConfig,
): PilotStats[] {
  const byPilot = groupBy(
    sortBy(claimedInSeason(flights, season, seasonConfig), (f) => f.date),
    (f) => f.pilot,
  );
  const stats = Object.entries(byPilot).map(([pilot, pilotFlights]) => {
    const completed = pilotFlights.filter(isCompletedTask);
    const completedOver = (km: number) =>
      completed.filter((f) => f.task.taskDistanceKm >= km).length;
    return {
      pilot,
      flights: pilotFlights.length,
      scoringKm: sumBy(pilotFlights, (f) => f.task.scoringDistanceKm),
      points: sumBy(pilotFlights, (f) => f.task.crossCountryPoints),
      bestKm: Math.max(...pilotFlights.map((f) => f.task.scoringDistanceKm)),
      bestPoints: Math.max(
        ...pilotFlights.map((f) => f.task.crossCountryPoints),
      ),
      completed: completed.length,
      completionPct: (100 * completed.length) / pilotFlights.length,
      avgSpeedKph: completed.length
        ? meanBy(completed, (f) => f.task.handicappedSpeedKph)
        : null,
      completed300: completedOver(300),
      completed500: completedOver(500),
      gliders: uniq(pilotFlights.map((f) => f.glider.registration)),
    };
  });
  return orderBy(stats, ["points", "pilot"], ["desc", "asc"]);
}

export interface MonthActivity {
  /** UTC year and month (1-12). */
  year: number;
  month: number;
  flights: number;
  scoringKm: number;
}

/**
 * Claimed flights and scoring km per calendar month of the season, from the
 * season's first month to its last, including months without flights.
 */
function monthlyActivity(
  flights: Flight[],
  season: number,
  seasonConfig: SeasonConfig,
): MonthActivity[] {
  const claimed = claimedInSeason(flights, season, seasonConfig);
  const { start, end } = seasonConfig;
  const months = ((end.month - start.month + 12) % 12) + 1;
  return Array.from({ length: months }, (_, i) => {
    const date = new Date(Date.UTC(season, start.month - 1 + i, 1));
    const [year, month] = [date.getUTCFullYear(), date.getUTCMonth() + 1];
    const inMonth = claimed.filter(
      (f) =>
        f.date.getUTCFullYear() === year && f.date.getUTCMonth() + 1 === month,
    );
    return {
      year,
      month,
      flights: inMonth.length,
      scoringKm: sumBy(inMonth, (f) => f.task.scoringDistanceKm),
    };
  });
}

export interface DayStats {
  date: Date;
  /** The day's flights, longest scoring distance first. */
  flights: Flight[];
  scoringKm: number;
}

/** The season's days with the most scoring km (then most flights), best first. */
function bestDays(
  flights: Flight[],
  season: number,
  seasonConfig: SeasonConfig,
  limit = 10,
): DayStats[] {
  const byDay = groupBy(claimedInSeason(flights, season, seasonConfig), (f) =>
    f.date.getTime(),
  );
  const days = Object.values(byDay).map((dayFlights) => ({
    date: dayFlights[0].date,
    flights: orderBy(dayFlights, (f) => f.task.scoringDistanceKm, "desc"),
    scoringKm: sumBy(dayFlights, (f) => f.task.scoringDistanceKm),
  }));
  return orderBy(
    days,
    ["scoringKm", (d) => d.flights.length, (d) => d.date.getTime()],
    ["desc", "desc", "asc"],
  ).slice(0, limit);
}

export interface TaskCount {
  completed: number;
  total: number;
}

/** A task's shape, FAI triangles (as the BGA classes them) apart. */
export type ShapeKey = "fai-triangle" | TaskShape;

const shapeOf = (f: Flight): ShapeKey =>
  f.task.isFaiTriangle ? "fai-triangle" : f.task.taskShape;

export interface TaskBreakdown {
  /** Per distance category (see `categories`), keyed like them. */
  bands: Record<string, TaskCount>;
  shapes: Record<ShapeKey, TaskCount>;
}

export interface TopTask extends TaskCount {
  /** Start, turnpoints and finish, in the direction flown most often. */
  route: string[];
  taskDistanceKm: number;
  /** Mean handicapped speed of completed tasks; null without any. */
  avgSpeedKph: number | null;
  /** The task's completed flights fastest first, then the rest longest first. */
  flights: Flight[];
}

const taskCount = (fs: Flight[]): TaskCount => ({
  completed: fs.filter(isCompletedTask).length,
  total: fs.length,
});

/** The season's tasks: completed vs attempted per distance category and shape. */
function taskBreakdown(
  flights: Flight[],
  season: number,
  seasonConfig: SeasonConfig,
): TaskBreakdown {
  const claimed = claimedInSeason(flights, season, seasonConfig);
  const stats = calculateStats(claimed);
  const byShape = groupBy(claimed, shapeOf);
  return {
    bands: Object.fromEntries(
      categories.map(({ key }) => [
        key,
        {
          completed: stats[key]?.completed ?? 0,
          total: stats[key]?.total ?? 0,
        },
      ]),
    ),
    shapes: {
      "fai-triangle": taskCount(byShape["fai-triangle"] ?? []),
      triangle: taskCount(byShape.triangle ?? []),
      "out-and-return": taskCount(byShape["out-and-return"] ?? []),
      other: taskCount(byShape.other ?? []),
    },
  };
}

const routeOf = (f: Flight) => [
  f.task.start,
  ...f.task.turnpoints,
  f.task.finish,
];

/**
 * The season's most flown tasks, a task and its reverse counting as one (e.g.
 * GRL-RUS-RAM-GRL and GRL-RAM-RUS-GRL). Tasks using a user-defined point (a
 * code starting with "*") are left out, as nobody else can fly them.
 */
function topTasks(
  flights: Flight[],
  season: number,
  seasonConfig: SeasonConfig,
  limit = 10,
): TopTask[] {
  const tasks = claimedInSeason(flights, season, seasonConfig).filter((f) =>
    routeOf(f).every((code) => code && !code.startsWith("*")),
  );
  const byTask = groupBy(tasks, (f) => {
    const route = routeOf(f);
    return [route.join("-"), [...route].reverse().join("-")].sort()[0];
  });
  const top = Object.values(byTask).map((taskFlights) => {
    const byDirection = groupBy(taskFlights, (f) => routeOf(f).join("-"));
    const [usual] = orderBy(
      Object.values(byDirection),
      [(fs) => fs.length, (fs) => routeOf(fs[0]).join("-")],
      ["desc", "asc"],
    );
    const completed = taskFlights.filter(isCompletedTask);
    return {
      route: routeOf(usual[0]),
      taskDistanceKm: usual[0].task.taskDistanceKm,
      ...taskCount(taskFlights),
      avgSpeedKph: completed.length
        ? meanBy(completed, (f) => f.task.handicappedSpeedKph)
        : null,
      flights: orderBy(
        taskFlights,
        [
          isCompletedTask,
          (f) => (isCompletedTask(f) ? f.task.handicappedSpeedKph : 0),
          (f) => f.task.scoringDistanceKm,
        ],
        ["desc", "desc", "desc"],
      ),
    };
  });
  return orderBy(
    top,
    ["total", (t) => t.route.join("-")],
    ["desc", "asc"],
  ).slice(0, limit);
}

export interface PilotColumn {
  key: string;
  label: string;
  /** The column's tooltip, when the label needs explaining. */
  title?: string;
  /** The value sorted on; null sorts last. */
  value: (s: PilotStats) => number | string | null;
  format: (s: PilotStats) => string;
  /** Only in the spreadsheet copy, as it's too wide for the table. */
  copyOnly?: boolean;
}

const decimal = (digits: number) => (v: number) =>
  v.toLocaleString("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
const whole = decimal(0);

const column = (
  key: string,
  label: string,
  value: (s: PilotStats) => number,
  format: (v: number) => string = whole,
  title?: string,
): PilotColumn => ({
  key,
  label,
  title,
  value,
  format: (s) => format(value(s)),
});

/** The per-pilot table's columns, also used for the spreadsheet copy. */
const pilotColumns: PilotColumn[] = [
  {
    key: "pilot",
    label: "Pilot",
    value: (s) => formatPilotName(s.pilot),
    format: (s) => formatPilotName(s.pilot),
  },
  column("flights", "Flights", (s) => s.flights),
  column("scoringKm", "Km", (s) => s.scoringKm, whole, "Total scoring km"),
  column("points", "Points", (s) => s.points),
  column("bestKm", "Best km", (s) => s.bestKm, decimal(1)),
  column("bestPoints", "Best pts", (s) => s.bestPoints),
  column(
    "completionPct",
    "Completed",
    (s) => s.completionPct,
    (v) => `${whole(v)}%`,
    "Flights that were declared, completed tasks",
  ),
  {
    key: "avgSpeedKph",
    label: "Avg kph",
    title: "Mean handicapped speed of completed tasks",
    value: (s) => s.avgSpeedKph,
    format: (s) => (s.avgSpeedKph === null ? "" : decimal(1)(s.avgSpeedKph)),
  },
  column(
    "completed300",
    "300+",
    (s) => s.completed300,
    whole,
    "Completed tasks of 300 km or more",
  ),
  column(
    "completed500",
    "500+",
    (s) => s.completed500,
    whole,
    "Completed tasks of 500 km or more",
  ),
  {
    key: "gliders",
    label: "Gliders",
    value: (s) => s.gliders.join(", "),
    format: (s) => s.gliders.join(", "),
    copyOnly: true,
  },
];

/** The table as tab-separatable rows, headed by the column labels. */
function pilotStatsCopyData(stats: PilotStats[]): string[][] {
  return [
    pilotColumns.map((c) => c.label),
    ...stats.map((s) => pilotColumns.map((c) => c.format(s))),
  ];
}

export {
  bestDays,
  calculateStats,
  categories,
  monthlyActivity,
  pilotColumns,
  pilotStats,
  pilotStatsCopyData,
  seasonSummary,
  taskBreakdown,
  topTasks,
  updateCategory,
  updateStats,
};
