import React from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

import TROPHIES from "../lib/cgc_trophies";
import FlightLoadFailure from "../components/FlightLoadFailure";
import Loading from "../components/Loading";
import PageLayout from "../components/PageLayout";
import Season from "../components/Season";
import Stats from "../components/Stats";
import Tooltip from "../components/Tooltip";
import { trophyEval, ladderEval } from "../lib/eval";
import { formatPilotName } from "../lib/trophyCopyData";
import useFlights from "../lib/useFlights";
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  LadderResult,
  ScoredFlight,
} from "../types";

function formatScore(trophy: any): string {
  if (trophy.type === "ladder") {
    const lr = trophy.results[0] as LadderResult | undefined;
    return lr ? `${lr.totalScore.toFixed(0)} pts` : "";
  }
  const sf = trophy.results[0] as ScoredFlight | undefined;
  if (!sf) return "";
  const { value, unit } = sf.score;
  return unit === "pts"
    ? `${value.toFixed(0)} ${unit}`
    : `${value.toFixed(1)} ${unit}`;
}

function formatWinner(trophy: any): string {
  if (trophy.type === "ladder") {
    const lr = trophy.results[0] as LadderResult | undefined;
    if (!lr) return "No qualifying flights";
    return trophy.groupBy === "registration"
      ? `${lr.key} (${lr.pilots.map(formatPilotName).join(", ")})`
      : formatPilotName(lr.key);
  }
  const sf = trophy.results[0] as ScoredFlight | undefined;
  return sf ? formatPilotName(sf.pilot) : "No qualifying flights";
}

const TrophyList = ({
  flights,
  season,
}: {
  flights: Flight[];
  season: number;
}) => {
  const trophies = TROPHIES.trophies.map((trophy) => {
    const results =
      trophy.type === "ladder"
        ? ladderEval(TROPHIES.config, season, flights, trophy as LadderTrophy)
        : trophyEval(TROPHIES.config, season, flights, trophy as FlightTrophy);
    return {
      ...trophy,
      results,
      groupBy: (trophy as LadderTrophy).groupBy,
      season,
    };
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Trophy
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Winner
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {trophies.map((trophy) => {
            const hasResults = trophy.results.length > 0;
            return (
              <tr
                key={trophy.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/trophy/${trophy.id}?season=${season}`}
                    className="font-medium text-cambridge hover:text-cambridge-dark transition-colors"
                  >
                    {trophy.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {hasResults ? (
                    formatWinner(trophy)
                  ) : (
                    <span className="text-gray-400 italic">
                      No qualifying flights
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {hasResults ? formatScore(trophy) : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const TrophiesPage = () => {
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  return (
    <PageLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            CGC {season} Trophies
          </h1>
          <div className="flex items-center gap-4">
            <Season season={season} />
            <Tooltip text="Admin view">
              <Link
                href={`/admin?season=${season}`}
                className="p-2 rounded-lg text-gray-400 hover:text-cambridge hover:bg-cambridge-light transition-colors"
              >
                <Settings size={18} />
              </Link>
            </Tooltip>
          </div>
        </div>
        <Stats flights={flights!} season={season} />
        <TrophyList flights={flights!} season={season} />
      </div>
    </PageLayout>
  );
};

export default TrophiesPage;
