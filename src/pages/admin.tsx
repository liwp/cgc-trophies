import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Map as MapIcon,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

import CONFIG from "trophies-config";
import FlightLoadFailure from "../components/FlightLoadFailure";
import HeightLossWarning from "../components/HeightLossWarning";
import Loading from "../components/Loading";
import PageLayout from "../components/PageLayout";
import Season from "../components/Season";
import Stats from "../components/Stats";
import Tooltip from "../components/Tooltip";
import { ladderEval, trophyEval } from "../lib/eval";
import {
  copyDataToClipboard,
  flightCopyData,
  formatPilotName,
  ladderCopyData,
} from "../lib/trophyCopyData";
import useFlights from "../lib/useFlights";
import type {
  Flight,
  FlightTrophy,
  LadderResult,
  LadderTrophy,
  ScoredFlight,
} from "../types";

const CopyButton = ({ data }: { data: string[][] }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyDataToClipboard(data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Tooltip text={copied ? "Copied!" : "Copy for spreadsheet"} align="right">
      <button
        type="button"
        aria-label="Copy to clipboard"
        className={`p-1 rounded hover:bg-gray-100 ${copied ? "text-green-600" : "text-gray-400"}`}
        onClick={handleCopy}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </Tooltip>
  );
};

const FlightResultEntry = ({
  result,
  rank,
}: {
  result: ScoredFlight;
  rank: number;
}) => {
  const { date, id, pilot, score, task } = result;
  const tps = [task.start, ...task.turnpoints, task.finish].join(" - ");
  const scoreDisplay =
    score.unit === "pts"
      ? `${score.value.toFixed(0)} ${score.unit}`
      : `${score.value.toFixed(1)} ${score.unit}`;

  return (
    <tr
      className={
        rank === 1 ? "bg-cambridge-light" : "hover:bg-gray-50 transition-colors"
      }
    >
      <td className="px-4 py-2 text-gray-500 text-sm">{rank}</td>
      <td className="px-4 py-2 text-gray-700">{formatPilotName(pilot)}</td>
      <td className="px-4 py-2 text-gray-700">{scoreDisplay}</td>
      <td className="px-4 py-2 text-gray-500 text-sm">
        {date.toLocaleDateString()}
      </td>
      <td className="px-4 py-2 text-gray-500 text-sm">{tps}</td>
      <td className="px-4 py-2">
        <div className="inline-flex items-center gap-1">
          <Tooltip text="BGA Ladder">
            <a
              href={`https://www.bgaladder.net/flightdetails/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cambridge transition-colors"
            >
              <BarChart3 size={14} />
            </a>
          </Tooltip>
          <Tooltip text="IGC Viewer">
            <a
              href={`https://igcviewer.bgaladder.net/?igc=https://api.bgaladder.net/api/FlightIGC/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cambridge transition-colors"
            >
              <MapIcon size={14} />
            </a>
          </Tooltip>
          <HeightLossWarning
            flightId={id}
            reportedHeightLoss={task.heightLoss}
          />
          <CopyButton data={flightCopyData(result)} />
        </div>
      </td>
    </tr>
  );
};

const LadderFlightRow = ({ flight }: { flight: Flight }) => (
  <tr className="bg-gray-50">
    <td className="px-4 py-1.5" />
    <td className="px-4 py-1.5 text-gray-500 text-sm pl-10">
      {formatPilotName(flight.pilot)}
    </td>
    <td className="px-4 py-1.5 text-gray-500 text-sm">
      {flight.task.crossCountryPoints.toFixed(0)} pts
    </td>
    <td className="px-4 py-1.5 text-gray-500 text-sm">
      {flight.date.toLocaleDateString()}
    </td>
    <td className="px-4 py-1.5" />
    <td className="px-4 py-1.5">
      <div className="inline-flex items-center gap-1">
        <Tooltip text="BGA Ladder">
          <a
            href={`https://www.bgaladder.net/flightdetails/${flight.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-cambridge transition-colors"
          >
            <BarChart3 size={14} className="inline" />
          </a>
        </Tooltip>
        <Tooltip text="IGC Viewer">
          <a
            href={`https://igcviewer.bgaladder.net/?igc=https://api.bgaladder.net/api/FlightIGC/${flight.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-cambridge transition-colors"
          >
            <MapIcon size={14} className="inline" />
          </a>
        </Tooltip>
        <HeightLossWarning
          flightId={flight.id}
          reportedHeightLoss={flight.task.heightLoss}
        />
      </div>
    </td>
  </tr>
);

const LadderResultEntry = ({
  result,
  rank,
  isSyndicate,
}: {
  result: LadderResult;
  rank: number;
  isSyndicate: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${rank === 1 ? "bg-cambridge-light" : "hover:bg-gray-50"}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-2 text-gray-500 text-sm">{rank}</td>
        <td className="px-4 py-2 text-gray-700">
          <div className="inline-flex items-center gap-1">
            {isSyndicate
              ? `${result.key} (${result.pilots.map(formatPilotName).join(", ")})`
              : formatPilotName(result.key)}
            {result.flights.map((f) => (
              <HeightLossWarning
                key={f.id}
                flightId={f.id}
                reportedHeightLoss={f.task.heightLoss}
              />
            ))}
          </div>
        </td>
        <td className="px-4 py-2 text-gray-700">
          {result.totalScore.toFixed(0)} pts
        </td>
        <td className="px-4 py-2 text-gray-500 text-sm">
          {result.flights.length} flights
        </td>
        <td className="px-4 py-2" />
        <td className="px-4 py-2">
          <div className="inline-flex items-center gap-1">
            <CopyButton
              data={ladderCopyData(
                result,
                isSyndicate ? "registration" : "pilot",
              )}
            />
            {expanded ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </div>
        </td>
      </tr>
      {expanded &&
        result.flights.map((flight) => (
          <LadderFlightRow key={flight.id} flight={flight} />
        ))}
    </>
  );
};

const TrophySection = ({
  trophy,
  flights,
  allFlights,
  season,
}: {
  trophy: (typeof CONFIG.trophies)[number];
  flights: Flight[];
  allFlights: Flight[];
  season: number;
}) => {
  const [showAll, setShowAll] = useState(false);
  const isLadder = trophy.type === "ladder";
  const isSyndicate =
    isLadder && (trophy as LadderTrophy).groupBy === "registration";

  const results = isLadder
    ? ladderEval(
        CONFIG.season,
        season,
        allFlights,
        trophy as LadderTrophy,
        CONFIG.pilotMilestones,
      )
    : trophyEval(
        CONFIG.season,
        season,
        flights,
        trophy as FlightTrophy,
        CONFIG.pilotMilestones,
      );

  const winner = results[0];
  const winnerFlights: Flight[] = winner
    ? isLadder
      ? (winner as LadderResult).flights
      : [winner as ScoredFlight]
    : [];
  let winnerLabel = "No qualifying flights";
  if (winner) {
    if (isLadder) {
      const lr = winner as LadderResult;
      winnerLabel = isSyndicate
        ? `${lr.key} (${lr.pilots.map(formatPilotName).join(", ")}) — ${lr.totalScore.toFixed(0)} pts`
        : `${formatPilotName(lr.key)} — ${lr.totalScore.toFixed(0)} pts`;
    } else {
      const sf = winner as ScoredFlight;
      const { value, unit } = sf.score;
      const scoreStr =
        unit === "pts"
          ? `${value.toFixed(0)} ${unit}`
          : `${value.toFixed(1)} ${unit}`;
      winnerLabel = `${formatPilotName(sf.pilot)} — ${scoreStr}`;
    }
  }

  return (
    <div id={`trophy-${trophy.id}`} className="scroll-mt-4">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{trophy.name}</h3>
          {winnerFlights.map((f) => (
            <HeightLossWarning
              key={f.id}
              flightId={f.id}
              reportedHeightLoss={f.task.heightLoss}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500 shrink-0">{winnerLabel}</span>
      </div>
      <p className="text-sm text-gray-400 mb-3">{trophy.description}</p>

      {results.length > 0 && (
        <>
          <button
            type="button"
            className="text-sm text-cambridge hover:text-cambridge-dark transition-colors mb-2"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Hide results" : `Show all results (${results.length})`}
          </button>

          {showAll && (
            <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">
                      #
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">
                      {isLadder
                        ? isSyndicate
                          ? "Glider / Pilots"
                          : "Pilot"
                        : "Pilot"}
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">
                      Score
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">
                      {isLadder ? "Flights" : "Date"}
                    </th>
                    {!isLadder && (
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Task
                      </th>
                    )}
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLadder
                    ? (results as LadderResult[]).map((r, i) => (
                        <LadderResultEntry
                          key={r.key}
                          result={r}
                          rank={i + 1}
                          isSyndicate={isSyndicate}
                        />
                      ))
                    : (results as ScoredFlight[]).map((r, i) => (
                        <FlightResultEntry key={r.id} result={r} rank={i + 1} />
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const AdminPage = () => {
  const { error, flights, allFlights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  return (
    <PageLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/?season=${season}`}
              className="inline-flex items-center gap-1 text-cambridge hover:text-cambridge-dark transition-colors"
            >
              <ArrowLeft size={16} /> Public view
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {CONFIG.club.shortName} {season} Trophies — Admin
            </h1>
          </div>
          <Season season={season} />
        </div>

        <Stats flights={flights!} season={season} />

        <nav className="flex flex-wrap gap-2">
          {CONFIG.trophies.map((t) => (
            <a
              key={t.id}
              href={`#trophy-${t.id}`}
              className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-500 hover:text-cambridge hover:border-cambridge transition-colors"
            >
              {t.name}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-10">
          {CONFIG.trophies.map((trophy) => (
            <TrophySection
              key={trophy.id}
              trophy={trophy}
              flights={flights!}
              allFlights={allFlights!}
              season={season}
            />
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminPage;
