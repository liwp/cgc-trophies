import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import CONFIG from "trophies-config";
import BestDays from "../components/BestDays";
import FlightLoadFailure from "../components/FlightLoadFailure";
import Loading from "../components/Loading";
import MonthlyChart from "../components/MonthlyChart";
import PageLayout from "../components/PageLayout";
import PageNav from "../components/PageNav";
import PilotStatsTable from "../components/PilotStatsTable";
import Season from "../components/Season";
import Toggle from "../components/Toggle";
import {
  bestDays,
  monthlyActivity,
  pilotStats,
  type SeasonSummary,
  seasonSummary,
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
        <BestDays days={summaries.days} />
        <PilotStatsTable stats={summaries.pilots} />
      </div>
    </PageLayout>
  );
};

export default StatsPage;
