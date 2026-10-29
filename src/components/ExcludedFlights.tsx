import { formatDate } from "../lib/formatDate";
import { formatScore } from "../lib/results";
import { formatPilotName } from "../lib/trophyCopyData";
import type { ExcludedFlight } from "../types";
import FlightLinks from "./FlightLinks";
import Th from "./Th";

/** Flights that would have counted for a trophy, with why they don't. */
const ExcludedFlights = ({
  flights,
  compact = false,
}: {
  flights: ExcludedFlight[];
  compact?: boolean;
}) => {
  if (flights.length === 0) return null;

  const cell = `px-4 ${compact ? "py-2" : "py-3"}`;

  return (
    <div className="flex flex-col gap-2">
      <h3
        className={`${compact ? "text-sm" : "text-lg"} font-semibold text-gray-900`}
      >
        Excluded flights
      </h3>
      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table
          className={`w-full table-auto border-collapse ${compact ? "text-sm" : ""}`}
        >
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <Th compact={compact}>Pilot</Th>
              <Th compact={compact}>Date</Th>
              <Th compact={compact}>Score</Th>
              <Th compact={compact}>Reason</Th>
              <Th compact={compact}>Links</Th>
            </tr>
          </thead>
          <tbody>
            {flights.map((f) => (
              <tr key={f.id}>
                <td className={`${cell} text-gray-700`}>
                  {formatPilotName(f.pilot)}
                </td>
                <td className={`${cell} text-gray-500`}>
                  {formatDate(f.date)}
                </td>
                <td className={`${cell} text-gray-700`}>
                  {formatScore(f.score)}
                </td>
                <td className={`${cell} text-gray-500`}>{f.exclude}</td>
                <td className={cell}>
                  <FlightLinks flightId={f.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExcludedFlights;
