import React, { useState } from "react";
import { keyBy, uniqBy } from "lodash";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  ExternalLink,
} from "lucide-react";

import CONFIG from "../../../trophies.config";
import FlightLoadFailure from "../../components/FlightLoadFailure";
import Loading from "../../components/Loading";
import PageLayout from "../../components/PageLayout";
import Season from "../../components/Season";
import Tooltip from "../../components/Tooltip";
import UnknownTrophy from "../../components/UnknownTrophy";
import { trophyEval, ladderEval } from "../../lib/eval";
import { getTrophyNav } from "../../lib/trophyNav";
import TURNPOINTS from "../../lib/turnpoints";
import {
  copyDataToClipboard,
  flightCopyData,
  formatPilotName,
  ladderCopyData,
} from "../../lib/trophyCopyData";
import useFlights from "../../lib/useFlights";
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  LadderResult,
  ScoredFlight,
} from "../../types";

const TROPHIES_BY_ID = keyBy(CONFIG.trophies, "id");

const CopyButton = ({ data }: { data: [string, string][] }) => {
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
        aria-label="Copy to clipboard"
        className={`p-1 rounded hover:bg-gray-100 ${copied ? "text-green-600" : "text-gray-400"}`}
        onClick={handleCopy}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </Tooltip>
  );
};

const Score = ({ value, unit }: { value: number; unit: string }) => {
  let display: string;
  switch (unit) {
    case "km":
    case "kph":
      display = value.toFixed(1);
      break;
    case "pts":
      display = value.toFixed(0);
      break;
    default:
      display = String(value);
  }

  return (
    <span>
      {display} {unit}
    </span>
  );
};

const Task = ({
  task,
}: {
  task: { start: string; turnpoints: string[]; finish: string };
}) => {
  const tps = [task.start, ...task.turnpoints, task.finish];
  const fullNames = tps.map((tp) => TURNPOINTS[tp] || tp).join(" \u2013 ");

  return (
    <Tooltip text={fullNames}>
      <span>{tps.join(" \u2013 ")}</span>
    </Tooltip>
  );
};

const Result = ({ result, rank }: { result: ScoredFlight; rank: number }) => {
  const {
    date,
    id,
    pilot,
    score: { unit, value },
    task,
  } = result;

  return (
    <tr className={rank === 1 ? "bg-cambridge-light" : ""}>
      <td className="px-4 py-3 text-gray-700">{formatPilotName(pilot)}</td>
      <td className="px-4 py-3 text-gray-500">{date.toLocaleDateString()}</td>
      <td className="px-4 py-3 text-gray-700">
        <Score value={value} unit={unit} />
      </td>
      <td className="px-4 py-3 text-gray-500">
        <Task task={task} />
      </td>
      <td className="px-4 py-3 text-center">
        <div className="inline-flex items-center gap-1">
          {rank === 1 && <CopyButton data={flightCopyData(result)} />}
          <a
            href={`https://www.bgaladder.net/flightdetails/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-cambridge transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </td>
    </tr>
  );
};

const ResultsList = ({
  results,
  season,
  trophy,
}: {
  results: ScoredFlight[];
  season: number;
  trophy: string;
}) => {
  const [unique, setUnique] = useState(true);

  const filtered = unique ? uniqBy(results, "pilot") : results;

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 italic">
        No qualifying flights
      </div>
    );
  }

  return (
    <div>
      <div className="px-3 py-3">
        <Toggle
          id="unique"
          checked={unique}
          label="One flight per pilot?"
          onChange={() => setUnique(!unique)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Pilot
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Score
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Task
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Links
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((result, i) => (
              <Result key={result.id} result={result} rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LadderFlightRow = ({ flight }: { flight: Flight }) => {
  return (
    <tr className="bg-gray-50">
      <td className="px-4 py-2 pl-10 text-gray-500">
        {formatPilotName(flight.pilot)}
      </td>
      <td className="px-4 py-2 text-gray-500">
        {flight.date.toLocaleDateString()}
      </td>
      <td className="px-4 py-2 text-gray-500">
        {flight.task.crossCountryPoints.toFixed(0)} pts
      </td>
      <td className="px-4 py-2 text-center">
        <a
          href={`https://www.bgaladder.net/flightdetails/${flight.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-cambridge transition-colors"
        >
          <ExternalLink size={16} className="inline" />
        </a>
      </td>
    </tr>
  );
};

const LadderResultRow = ({
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
        className={`cursor-pointer hover:bg-gray-50 transition-colors ${rank === 1 ? "bg-cambridge-light" : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-gray-500">{rank}</td>
        <td className="px-4 py-3 text-gray-700">
          {isSyndicate ? result.key : formatPilotName(result.key)}
        </td>
        {isSyndicate && (
          <td className="px-4 py-3 text-gray-500">
            {result.pilots.map(formatPilotName).join(", ")}
          </td>
        )}
        <td className="px-4 py-3 text-gray-700">
          {result.totalScore.toFixed(0)} pts
        </td>
        <td className="px-4 py-3 text-gray-500">{result.flights.length}</td>
        <td className="px-4 py-3">
          <div className="inline-flex items-center gap-1">
            {rank === 1 && (
              <CopyButton
                data={ladderCopyData(
                  result,
                  isSyndicate ? "registration" : "pilot",
                )}
              />
            )}
            {expanded ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
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

const LadderResultsList = ({
  results,
  season,
  trophy,
  isSyndicate,
}: {
  results: LadderResult[];
  season: number;
  trophy: string;
  isSyndicate: boolean;
}) => {
  if (results.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 italic">
        No qualifying flights
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              {isSyndicate ? "Glider" : "Pilot"}
            </th>
            {isSyndicate && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Pilots
              </th>
            )}
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Score
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Flights
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, i) => (
            <LadderResultRow
              key={result.key}
              result={result}
              rank={i + 1}
              isSyndicate={isSyndicate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Toggle = ({
  id,
  label,
  onChange,
  checked,
}: {
  id: string;
  label: string;
  onChange: () => void;
  checked: boolean;
}) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <label htmlFor={id} className="text-sm text-gray-500 select-none cursor-pointer">
        {label}
      </label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
          checked ? "bg-cambridge" : "bg-gray-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 translate-y-0.5 ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
};

const TrophyNavBar = ({
  trophyId,
  season,
}: {
  trophyId: string;
  season: number;
}) => {
  const { prev, next } = getTrophyNav(trophyId);

  return (
    <div className="flex items-center justify-between">
      <NextLink
        href={`/?season=${season}`}
        className="inline-flex items-center gap-1 text-cambridge hover:text-cambridge-dark transition-colors"
      >
        <ArrowLeft size={16} /> <span>All Trophies</span>
      </NextLink>
      <div className="flex items-center gap-3 text-sm">
        {prev ? (
          <NextLink
            href={`/trophy/${prev.id}?season=${season}`}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-cambridge transition-colors"
          >
            <ChevronLeft size={16} /> {prev.name}
          </NextLink>
        ) : (
          <span />
        )}
        {prev && next && <span className="text-gray-300">|</span>}
        {next ? (
          <NextLink
            href={`/trophy/${next.id}?season=${season}`}
            className="inline-flex items-center gap-1 text-gray-500 hover:text-cambridge transition-colors"
          >
            {next.name} <ChevronRight size={16} />
          </NextLink>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
};

const TrophyPage = () => {
  const router = useRouter();
  const trophyId = router.query.trophyId as string;
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  const config = TROPHIES_BY_ID[trophyId];
  if (!config) return <UnknownTrophy trophyId={trophyId} />;

  const isLadder = config.type === "ladder";

  return (
    <PageLayout>
      <div className="flex flex-col gap-6">
        <TrophyNavBar trophyId={trophyId} season={season} />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{config.name}</h2>
          <Season season={season} />
        </div>

        <p className="text-sm text-gray-500">{config.description}</p>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {isLadder ? (
            <LadderResultsList
              results={ladderEval(
                CONFIG.season,
                season,
                flights!,
                config as LadderTrophy,
                CONFIG.pilotMilestones,
              )}
              season={season}
              trophy={config.name}
              isSyndicate={(config as LadderTrophy).groupBy === "registration"}
            />
          ) : (
            <ResultsList
              results={trophyEval(
                CONFIG.season,
                season,
                flights!,
                config as FlightTrophy,
                CONFIG.pilotMilestones,
              )}
              season={season}
              trophy={config.name}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default TrophyPage;
