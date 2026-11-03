import { type ReactNode, useState } from "react";
import { type DayStats, routeOf } from "../lib/stats";
import type { Flight } from "../types";
import { dateText as date, ExpandTh, pad, ShortDate, Th } from "./CompactTable";
import ExpandButton from "./ExpandButton";
import { PilotLink } from "./FlightRow";
import Route from "./Route";

const km = (v: number) => `${Math.round(v).toLocaleString("en-GB")} km`;

/** A list of a day's flights, one line each, in one column of its row. */
const FlightList = ({
  flights,
  item,
  className = "",
  truncate = true,
}: {
  flights: Flight[];
  item: (flight: Flight) => ReactNode;
  className?: string;
  /** Cut off a line that's too long; off where a line has a tooltip to show. */
  truncate?: boolean;
}) => (
  <ul className={`flex flex-col gap-1.5 ${className}`}>
    {flights.map((flight) => (
      <li key={flight.id} className={truncate ? "truncate" : ""}>
        {item(flight)}
      </li>
    ))}
  </ul>
);

const DayRow = ({ day }: { day: DayStats }) => {
  const [expanded, setExpanded] = useState(false);
  const { flights, scoringKm } = day;
  const weekday = date(day.date, { weekday: "short" });
  const dayMonth = date(day.date, { day: "numeric", month: "short" });
  const shown = expanded ? flights : flights.slice(0, 1);
  return (
    <tr className="border-b border-gray-100 align-top">
      <td className={`${pad} whitespace-nowrap font-medium text-gray-900`}>
        <ShortDate date={day.date} />
      </td>
      <td className={`${pad} text-right tabular-nums whitespace-nowrap`}>
        <div className="text-gray-700">{km(scoringKm)}</div>
        <div className="text-xs text-gray-400">
          {flights.length} {flights.length === 1 ? "flight" : "flights"}
        </div>
      </td>
      <td className={pad}>
        <FlightList
          flights={shown}
          item={(flight) => <PilotLink flight={flight} />}
        />
      </td>
      <td className={pad}>
        <FlightList
          flights={shown}
          className="text-right tabular-nums whitespace-nowrap text-gray-500"
          item={(flight) => km(flight.task.scoringDistanceKm)}
        />
      </td>
      {/* The task only where there's room for it. */}
      <td className={`${pad} hidden lg:table-cell`}>
        <FlightList
          flights={shown}
          truncate={false}
          className="whitespace-nowrap text-gray-700"
          item={(flight) => <Route route={routeOf(flight).filter(Boolean)} />}
        />
      </td>
      <td className="py-2 pr-1.5 sm:pr-4">
        {flights.length > 1 && (
          <ExpandButton
            expanded={expanded}
            onToggle={() => setExpanded(!expanded)}
            label={`All flights on ${weekday} ${dayMonth}`}
          />
        )}
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
        // Fixed widths, so expanding a day can't move the columns; the
        // flights column takes the rest. It fits a phone; the card still
        // scrolls if a screen is too narrow even for that.
        <table className="w-full min-w-72 table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <Th width="w-14 sm:w-28">Date</Th>
              <Th right width="w-[4.5rem] sm:w-32 lg:w-24">
                Total
              </Th>
              <Th width="">Longest flight</Th>
              <Th right width="w-[4.75rem] sm:w-28 lg:w-24">
                Distance
              </Th>
              <Th width="lg:w-80" className="hidden lg:table-cell">
                Task
              </Th>
              <ExpandTh width="w-7 sm:w-12" />
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
