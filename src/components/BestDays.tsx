import { type ReactNode, useState } from "react";
import { type DayStats, routeOf } from "../lib/stats";
import type { Flight } from "../types";
import { dateText as date, pad, ShortDate, Th } from "./CompactTable";
import ExpandButton, { ExpandSpacer } from "./ExpandButton";
import { useFlightDetails } from "./FlightDetails";
import { PilotWithMedal } from "./FlightRow";
import Route from "./Route";

const km = (v: number) => `${Math.round(v).toLocaleString("en-GB")} km`;

/** Which of a day's flights the pointer is on, to light up its whole line. */
type Hover = { id: string | null; set: (id: string | null) => void };

/**
 * A list of a day's flights, one line each, in one column of its row. A
 * flight's line, across all the columns, opens its details.
 */
const FlightList = ({
  flights,
  item,
  hover,
  className = "",
  truncate = true,
}: {
  flights: Flight[];
  item: (flight: Flight) => ReactNode;
  hover: Hover;
  className?: string;
  /** Cut off a line that's too long; off where a line has a tooltip to show. */
  truncate?: boolean;
}) => {
  const { open } = useFlightDetails();
  return (
    <ul className={`flex flex-col gap-1.5 ${className}`}>
      {flights.map((flight) => (
        // biome-ignore lint/a11y/useKeyWithClickEvents: the pilot's button is the keyboard way in
        <li
          key={flight.id}
          className={`-mx-1 cursor-pointer rounded px-1 ${truncate ? "truncate" : ""} ${
            hover.id === flight.id ? "bg-gray-100" : ""
          }`}
          onClick={() => open(flight)}
          onMouseEnter={() => hover.set(flight.id)}
          onMouseLeave={() => hover.set(null)}
        >
          {item(flight)}
        </li>
      ))}
    </ul>
  );
};

const DayRow = ({ day }: { day: DayStats }) => {
  const [expanded, setExpanded] = useState(false);
  const { flights, scoringKm } = day;
  const weekday = date(day.date, { weekday: "short" });
  const dayMonth = date(day.date, { day: "numeric", month: "short" });
  const shown = expanded ? flights : flights.slice(0, 1);
  const [hovered, setHovered] = useState<string | null>(null);
  const hover = { id: hovered, set: setHovered };
  return (
    <tr className="border-b border-gray-100 align-top">
      <td className={`${pad} whitespace-nowrap font-medium text-gray-900`}>
        <div className="flex items-start gap-1.5">
          {flights.length > 1 ? (
            <ExpandButton
              expanded={expanded}
              onToggle={() => setExpanded(!expanded)}
              label={`All flights on ${weekday} ${dayMonth}`}
              className="mt-0.5"
            />
          ) : (
            <ExpandSpacer />
          )}
          <ShortDate date={day.date} />
        </div>
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
          hover={hover}
          item={(flight) => <PilotWithMedal flight={flight} />}
        />
      </td>
      <td className={pad}>
        <FlightList
          flights={shown}
          hover={hover}
          className="text-right tabular-nums whitespace-nowrap text-gray-500"
          item={(flight) => km(flight.task.scoringDistanceKm)}
        />
      </td>
      {/* The task only where there's room for it. */}
      <td className={`${pad} hidden lg:table-cell`}>
        <FlightList
          flights={shown}
          hover={hover}
          truncate={false}
          className="whitespace-nowrap text-gray-700"
          item={(flight) => <Route route={routeOf(flight).filter(Boolean)} />}
        />
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
              <Th width="w-[4.75rem] sm:w-32">Date</Th>
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
