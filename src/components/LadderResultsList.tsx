import { useState } from "react";
import { formatDate } from "../lib/formatDate";
import { formatScore } from "../lib/results";
import { formatPilotName, ladderCopyData } from "../lib/trophyCopyData";
import type { Flight, LadderResult } from "../types";
import CopyButton from "./CopyButton";
import ExpandButton from "./ExpandButton";
import FlightLinks from "./FlightLinks";
import HeightLossWarning from "./HeightLossWarning";
import Th from "./Th";

const LadderFlightRow = ({
  flight,
  isSyndicate,
  showHeightLoss,
}: {
  flight: Flight;
  isSyndicate: boolean;
  showHeightLoss?: boolean;
}) => {
  return (
    <tr className="bg-gray-50">
      <td></td>
      <td className="px-4 py-2 text-gray-500">{formatDate(flight.date)}</td>
      {isSyndicate && (
        <td className="px-4 py-2 text-gray-500">
          {formatPilotName(flight.pilot)}
        </td>
      )}
      <td className="px-4 py-2 text-gray-500">
        {formatScore({ value: flight.task.crossCountryPoints, unit: "pts" })}
      </td>
      <td className="px-4 py-2 text-gray-500">
        {flight.task.scoringDistanceKm.toFixed(0)} km
      </td>
      <td className="px-4 py-2 text-gray-500">
        <div className="inline-flex items-center gap-1">
          <FlightLinks flightId={flight.id} inline />
          {showHeightLoss && (
            <HeightLossWarning
              flightId={flight.id}
              reportedHeightLoss={flight.task.heightLoss}
            />
          )}
        </div>
      </td>
      <td></td>
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
          {formatScore({ value: result.totalScore, unit: "pts" })}
        </td>
        <td className="px-4 py-3 text-gray-500">
          {result.totalDistance.toFixed(0)} km
        </td>
        <td className="px-4 py-3 text-gray-500">{result.flights.length}</td>
        <td className="px-4 py-3">
          <div className="inline-flex items-center gap-1">
            <ExpandButton
              expanded={expanded}
              onToggle={() => setExpanded(!expanded)}
              label={`Flights for ${isSyndicate ? result.key : formatPilotName(result.key)}`}
            />
            {rank === 1 && (
              <CopyButton
                data={ladderCopyData(
                  result,
                  isSyndicate ? "registration" : "pilot",
                )}
              />
            )}
          </div>
        </td>
      </tr>
      {expanded &&
        result.flights.map((flight) => (
          <LadderFlightRow
            key={flight.id}
            flight={flight}
            isSyndicate={isSyndicate}
            showHeightLoss={rank === 1}
          />
        ))}
    </>
  );
};

/** A pilot's (or glider's) ladder result as a card, for phones. */
const LadderResultCard = ({
  result,
  rank,
  isSyndicate,
}: {
  result: LadderResult;
  rank: number;
  isSyndicate: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const name = isSyndicate ? result.key : formatPilotName(result.key);

  return (
    <li
      className={`flex flex-col gap-0.5 border-t border-gray-100 px-3 py-2.5 ${rank === 1 ? "bg-cambridge-light" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-gray-900">
          <span className="text-gray-500">{rank}.</span> {name}
        </span>
        <span className="font-semibold whitespace-nowrap text-gray-700">
          {formatScore({ value: result.totalScore, unit: "pts" })}
        </span>
      </div>
      {isSyndicate && (
        <div className="text-xs text-gray-500">
          {result.pilots.map(formatPilotName).join(", ")}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
        <span>
          {result.totalDistance.toFixed(0)} km · {result.flights.length}{" "}
          {result.flights.length === 1 ? "flight" : "flights"}
        </span>
        <div className="inline-flex items-center gap-1">
          {rank === 1 && (
            <CopyButton
              data={ladderCopyData(
                result,
                isSyndicate ? "registration" : "pilot",
              )}
            />
          )}
          <ExpandButton
            expanded={expanded}
            onToggle={() => setExpanded(!expanded)}
            label={`Flights for ${name}`}
          />
        </div>
      </div>
      {expanded && (
        <ul className="mt-1 flex flex-col gap-1 text-xs text-gray-500">
          {result.flights.map((flight) => (
            <li key={flight.id}>
              <div className="flex items-center justify-between gap-2">
                <span>{formatDate(flight.date)}</span>
                <span className="inline-flex items-center gap-2">
                  <span className="whitespace-nowrap tabular-nums">
                    {formatScore({
                      value: flight.task.crossCountryPoints,
                      unit: "pts",
                    })}{" "}
                    · {flight.task.scoringDistanceKm.toFixed(0)} km
                  </span>
                  <FlightLinks flightId={flight.id} inline />
                  {rank === 1 && (
                    <HeightLossWarning
                      flightId={flight.id}
                      reportedHeightLoss={flight.task.heightLoss}
                    />
                  )}
                </span>
              </div>
              {isSyndicate && <div>{formatPilotName(flight.pilot)}</div>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

const LadderResultsList = ({
  results,
  isSyndicate,
}: {
  results: LadderResult[];
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
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <Th>Rank</Th>
              <Th>{isSyndicate ? "Glider" : "Pilot"}</Th>
              {isSyndicate && <Th>Pilots</Th>}
              <Th>Score</Th>
              <Th>Distance</Th>
              <Th>Flights</Th>
              <Th />
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
      <ul className="sm:hidden">
        {results.map((result, i) => (
          <LadderResultCard
            key={result.key}
            result={result}
            rank={i + 1}
            isSyndicate={isSyndicate}
          />
        ))}
      </ul>
    </>
  );
};

export default LadderResultsList;
