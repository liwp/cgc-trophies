import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import CONFIG from "trophies-config";
import BestDays from "../components/BestDays";
import CompletionChart from "../components/CompletionChart";
import FlightLoadFailure from "../components/FlightLoadFailure";
import Loading from "../components/Loading";
import MonthlyChart from "../components/MonthlyChart";
import PageLayout from "../components/PageLayout";
import PageNav from "../components/PageNav";
import PilotStatsTable from "../components/PilotStatsTable";
import Season from "../components/Season";
import Superlatives from "../components/Superlatives";
import Toggle from "../components/Toggle";
import TopTasks from "../components/TopTasks";
import {
  bestDays,
  monthlyActivity,
  pilotStats,
  type SeasonSummary,
  seasonSummary,
  superlatives,
  type TaskCount,
  taskBreakdown,
  topTasks,
} from "../lib/stats";
import useFlights from "../lib/useFlights";

const TILES: {
  key: keyof SeasonSummary;
  label: string;
  format?: (value: number) => string;
}[] = [
  { key: "flights", label: "Flights" },
  { key: "pilots", label: "Pilots" },
  { key: "gliders", label: "Gliders" },
  {
    key: "scoringKm",
    label: "Scoring km",
    format: (v) => Math.round(v).toLocaleString("en-GB"),
  },
  { key: "points", label: "Points" },
  { key: "completed", label: "Completed tasks" },
  {
    key: "declaredPct",
    label: "Declared",
    format: (v) => `${Math.round(v)}%`,
  },
];

// Non-breaking spaces keep each label on one line
const DISTANCE_BANDS = [
  { key: "under300km", label: "<\u00a0300\u00a0km" },
  { key: "300km", label: "300\u00a0km" },
  { key: "400km", label: "400\u00a0km" },
  { key: "500km", label: "500\u00a0km" },
  { key: "600km", label: "600\u00a0km" },
  { key: "750km", label: "750+\u00a0km" },
];

const bar = (label: string, count: TaskCount = { completed: 0, total: 0 }) => ({
  label,
  ...count,
});

const defaultFormat = (v: number) => v.toLocaleString("en-GB");

/** The change from last season, e.g. "+12"; nothing without data. */
const Change = ({
  current,
  previous,
  season,
  format,
}: {
  current: number;
  previous: number;
  season: number;
  format: (value: number) => string;
}) => {
  if (previous === 0 && current === 0) return null;
  const diff = current - previous;
  const colour =
    diff > 0 ? "text-green-700" : diff < 0 ? "text-red-700" : "text-gray-400";
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
  return (
    <div className={`text-xs ${colour}`}>
      {sign}
      {format(Math.abs(diff))}
      <span className="sr-only"> vs {season - 1}</span>
    </div>
  );
};

const SummaryTiles = ({
  current,
  previous,
  season,
}: {
  current: SeasonSummary;
  previous: SeasonSummary;
  season: number;
}) => (
  <div className="flex flex-col gap-2">
    <ul
      aria-label="Season summary"
      className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3"
    >
      {TILES.map(({ key, label, format = defaultFormat }) => (
        <li
          key={key}
          className="rounded-xl border border-gray-200 bg-white px-2 py-3 text-center"
        >
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1 tabular-nums">
            {format(current[key])}
          </div>
          <Change
            current={current[key]}
            previous={previous[key]}
            season={season}
            format={format}
          />
        </li>
      ))}
    </ul>
    <p className="text-xs text-gray-400 text-right">
      Changes are from {season - 1}
    </p>
  </div>
);

const StatsPage = () => {
  const state = useFlights();
  const [searchParams, setSearchParams] = useSearchParams();
  // Home-site launches by default; ?site=all includes flights launched elsewhere.
  const homeOnly = searchParams.get("site") !== "all";

  const toggleHomeOnly = () =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (homeOnly) next.set("site", "all");
        else next.delete("site");
        return next;
      },
      { replace: true },
    );

  const summaries = useMemo(() => {
    if (state.status !== "ready") return undefined;
    const flights = homeOnly ? state.flights : state.allFlights;
    return {
      current: seasonSummary(flights, state.season, CONFIG.season),
      previous: seasonSummary(flights, state.season - 1, CONFIG.season),
      awards: superlatives(flights, state.season, CONFIG.season),
      tasks: taskBreakdown(flights, state.season, CONFIG.season),
      topTasks: topTasks(flights, state.season, CONFIG.season),
      days: bestDays(flights, state.season, CONFIG.season),
      pilots: pilotStats(flights, state.season, CONFIG.season),
      months: monthlyActivity(flights, state.season, CONFIG.season),
      previousMonths: monthlyActivity(flights, state.season - 1, CONFIG.season),
    };
  }, [state, homeOnly]);

  if (state.status === "error") return <FlightLoadFailure />;
  if (!summaries) return <Loading />;
  const { season } = state;

  return (
    <PageLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {CONFIG.club.shortName} {season} Stats
          </h1>
          <div className="flex items-center gap-4">
            <Season season={season} />
            <PageNav current="stats" season={season} />
          </div>
        </div>
        <Toggle
          id="home-only"
          label={`${CONFIG.club.launchSite} launches only`}
          checked={homeOnly}
          onChange={toggleHomeOnly}
        />
        <SummaryTiles
          current={summaries.current}
          previous={summaries.previous}
          season={season}
        />
        <Superlatives cards={summaries.awards} />
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-gray-900">By month</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <MonthlyChart
              title="Flights"
              season={season}
              months={summaries.months}
              previous={summaries.previousMonths}
              value={(m) => m.flights}
              format={(v) => `${v} ${v === 1 ? "flight" : "flights"}`}
            />
            <MonthlyChart
              title="Scoring km"
              season={season}
              months={summaries.months}
              previous={summaries.previousMonths}
              value={(m) => m.scoringKm}
              format={(v) => `${Math.round(v).toLocaleString("en-GB")} km`}
            />
          </div>
        </section>
        <section aria-labelledby="tasks" className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h2 id="tasks" className="text-lg font-semibold text-gray-900">
              Tasks
            </h2>
            <p aria-hidden className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-cambridge-dark" />
                Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-gray-300" />
                Not completed
              </span>
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
            <CompletionChart
              title="By distance"
              bars={DISTANCE_BANDS.map(({ key, label }) =>
                bar(label, summaries.tasks.bands[key]),
              )}
            />
            <CompletionChart
              title="By shape"
              bars={[
                bar("FAI triangle", summaries.tasks.shapes["fai-triangle"]),
                bar("Triangle", summaries.tasks.shapes.triangle),
                bar("Out & return", summaries.tasks.shapes["out-and-return"]),
                bar("Other", summaries.tasks.shapes.other),
              ]}
            />
          </div>
        </section>
        <TopTasks tasks={summaries.topTasks} />
        <BestDays days={summaries.days} />
        <PilotStatsTable stats={summaries.pilots} />
      </div>
    </PageLayout>
  );
};

export default StatsPage;
