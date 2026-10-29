import { useState } from "react";
import { flightDetailsUrl } from "../lib/links";
import type { DayStats } from "../lib/stats";
import { formatPilotName } from "../lib/trophyCopyData";
import type { Flight } from "../types";
import ExpandButton from "./ExpandButton";
import Th from "./Th";

const km = (v: number) => `${Math.round(v).toLocaleString("en-GB")} km`;

const linkClass = "text-cambridge hover:text-cambridge-dark";

const FlightLink = ({ flight }: { flight: Flight }) => (
  <li className="flex justify-between gap-6">
    <a
      href={flightDetailsUrl(flight.id)}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {formatPilotName(flight.pilot)}
    </a>
    <span className="text-gray-500 tabular-nums">
      {km(flight.task.scoringDistanceKm)}
    </span>
  </li>
);

const DayRow = ({ day }: { day: DayStats }) => {
  const [expanded, setExpanded] = useState(false);
  const { date, flights, scoringKm } = day;
  const dateText = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const [longest, ...rest] = flights;
  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">
        {dateText}
      </td>
      <td className="px-4 py-2 text-right tabular-nums text-gray-700">
        {flights.length}
      </td>
      <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap text-gray-700">
        {km(scoringKm)}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
        <div className="flex items-start gap-2">
          <ul className="flex max-w-72 flex-1 flex-col gap-1.5">
            <FlightLink flight={longest} />
            {expanded &&
              rest.map((flight) => (
                <FlightLink key={flight.id} flight={flight} />
              ))}
          </ul>
          {rest.length > 0 && (
            <ExpandButton
              expanded={expanded}
              onToggle={() => setExpanded(!expanded)}
              label={`All flights on ${dateText}`}
            />
          )}
        </div>
      </td>
    </tr>
  );
};

/** The season's best soaring days, by total scoring km. */
const BestDays = ({ days }: { days: DayStats[] }) => (
  <section aria-labelledby="best-days" className="flex flex-col gap-2">
    <h2 id="best-days" className="text-lg font-semibold text-gray-900">
      Best days
    </h2>
    <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
      {days.length === 0 ? (
        <p className="px-4 py-3 text-gray-400 italic">No flights</p>
      ) : (
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <Th>Date</Th>
              <Th align="right">Flights</Th>
              <Th align="right">Total km</Th>
              <Th>Longest flight</Th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <DayRow key={day.date.getTime()} day={day} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  </section>
);

export default BestDays;
