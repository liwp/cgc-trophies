import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { formatScore } from "../lib/results";
import { formatPilotName, ladderCopyData } from "../lib/trophyCopyData";
import type { Flight, LadderResult } from "../types";
import CopyButton from "./CopyButton";
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
      <td className="px-4 py-2 text-gray-500">
        {flight.date.toLocaleDateString()}
      </td>
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
            {expanded ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
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
    <div className="overflow-x-auto">
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
  );
};

export default LadderResultsList;
