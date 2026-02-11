import React, { useState } from "react";
import { keyBy, sample, uniqBy } from "lodash";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

import CGC_TROPHIES from "../../lib/cgc_trophies";
import FlightLoadFailure from "../../components/FlightLoadFailure";
import Loading from "../../components/Loading";
import Season from "../../components/Season";
import UnknownTrophy from "../../components/UnknownTrophy";
import { trophyEval, ladderEval } from "../../lib/eval";
import useFlights from "../../lib/useFlights";
import { formatPilotName } from "../../lib/trophyCopyData";
import type {
  Flight,
  FlightTrophy,
  LadderTrophy,
  LadderResult,
  ScoredFlight,
  Trophy,
} from "../../types";

const CONFIG = CGC_TROPHIES.config;
const TROPHIES = keyBy(CGC_TROPHIES.trophies, "id");

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

  return <span>{tps.join(" - ")}</span>;
};

const Result = ({ result }: { result: ScoredFlight }) => {
  const {
    date,
    id,
    pilot,
    score: { unit, value },
    task,
  } = result;

  return (
    <tr>
      <td className="p-2">{formatPilotName(pilot)}</td>
      <td className="p-2">{date.toLocaleDateString()}</td>
      <td className="p-2">
        <Score value={value} unit={unit} />
      </td>
      <td className="p-2">
        <Task task={task} />
      </td>
      <td className="p-2 text-center">
        <a
          href={`https://www.bgaladder.net/flightdetails/${id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={16} className="inline" />
        </a>
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
      <div className="text-center">
        <h3 className="text-sm font-semibold">No qualifying flights</h3>
      </div>
    );
  }

  return (
    <div>
      <div className="pb-5">
        <Toggle
          id="unique"
          checked={unique}
          label="One flight per pilot?"
          onChange={() => setUnique(!unique)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <caption className="caption-bottom py-2 text-sm text-gray-500">
            {trophy} {season} Results
          </caption>
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left font-semibold">Pilot</th>
              <th className="p-2 text-left font-semibold">Date</th>
              <th className="p-2 text-left font-semibold">Score</th>
              <th className="p-2 text-left font-semibold">Task</th>
              <th className="p-2 text-center font-semibold">Ladder</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((result, i) => (
              <Result key={result.id} result={result} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LadderFlightRow = ({ flight }: { flight: Flight }) => {
  return (
    <tr>
      <td className="p-2 pl-10">{formatPilotName(flight.pilot)}</td>
      <td className="p-2">{flight.date.toLocaleDateString()}</td>
      <td className="p-2">{flight.task.crossCountryPoints.toFixed(0)} pts</td>
      <td className="p-2 text-center">
        <a
          href={`https://www.bgaladder.net/flightdetails/${flight.id}`}
          target="_blank"
          rel="noopener noreferrer"
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
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="p-2">{rank}</td>
        <td className="p-2">
          {isSyndicate ? result.key : formatPilotName(result.key)}
        </td>
        {isSyndicate && (
          <td className="p-2">
            {result.pilots.map(formatPilotName).join(", ")}
          </td>
        )}
        <td className="p-2">{result.totalScore.toFixed(0)} pts</td>
        <td className="p-2">{result.flights.length}</td>
        <td className="p-2">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
      <div className="text-center">
        <h3 className="text-sm font-semibold">No qualifying flights</h3>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse">
        <caption className="caption-bottom py-2 text-sm text-gray-500">
          {trophy} {season} Results
        </caption>
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left font-semibold">Rank</th>
            <th className="p-2 text-left font-semibold">
              {isSyndicate ? "Glider" : "Pilot"}
            </th>
            {isSyndicate && (
              <th className="p-2 text-left font-semibold">Pilots</th>
            )}
            <th className="p-2 text-left font-semibold">Score</th>
            <th className="p-2 text-left font-semibold">Flights</th>
            <th className="p-2"></th>
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

const TrophyImage = ({ image }: { image?: string }) => {
  return !!image ? (
    <img
      alt="trophy photo"
      className="rounded h-[150px] w-[150px] object-cover"
      src={image}
    />
  ) : null;
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
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4"
      />
    </div>
  );
};

const AllTrophies = ({ season }: { season: number }) => {
  return (
    <div className="flex items-center">
      <NextLink
        href={`/?season=${season}`}
        className="inline-flex items-center gap-1"
      >
        <ArrowLeft size={16} /> <span>All Trophies</span>
      </NextLink>
    </div>
  );
};

const TrophyPage = () => {
  const router = useRouter();
  const trophyId = router.query.trophyId as string;
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  const config = TROPHIES[trophyId];
  if (!config) return <UnknownTrophy trophyId={trophyId} />;

  const isLadder = config.type === "ladder";

  return (
    <div className="border rounded-lg">
      <AllTrophies season={season} />

      <div className="p-4 flex items-center">
        <h2 className="text-lg font-semibold flex-1">{config.name}</h2>
        <Season season={season} />
      </div>

      <div className="p-4">
        <div className="flex flex-col gap-4">
          <hr />
          <div>
            <TrophyImage image={sample(config.img)} />
            <p className="pt-2 text-sm">{config.description}</p>
          </div>

          <hr />
          {isLadder ? (
            <LadderResultsList
              results={ladderEval(
                CONFIG,
                season,
                flights!,
                config as LadderTrophy,
              )}
              season={season}
              trophy={config.name}
              isSyndicate={(config as LadderTrophy).groupBy === "registration"}
            />
          ) : (
            <ResultsList
              results={trophyEval(
                CONFIG,
                season,
                flights!,
                config as FlightTrophy,
              )}
              season={season}
              trophy={config.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TrophyPage;
