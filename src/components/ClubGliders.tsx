import { useState } from "react";
import type { ClubGliderStats } from "../lib/stats";
import type { Flight } from "../types";
import ExpandButton from "./ExpandButton";
import FlightRow, { FlightSpeed, kph } from "./FlightRow";
import Th from "./Th";

const km = (v: number) => `${Math.round(v).toLocaleString("en-GB")} km`;

const cell =
  "px-4 py-2 text-right tabular-nums whitespace-nowrap text-gray-700";
const flightCell = "px-4 py-1.5 text-right tabular-nums whitespace-nowrap";

const route = ({ task }: Flight) =>
  [task.start, ...task.turnpoints, task.finish].join("-");

const GliderFlightRow = ({ flight }: { flight: Flight }) => (
  <FlightRow
    flight={flight}
    span={2}
    // Long routes wrap, so they don't widen the table
    detail={
      <span className="font-mono whitespace-normal">{route(flight)}</span>
    }
  >
    <td className={flightCell}>
      <FlightSpeed flight={flight} />
    </td>
    <td className={flightCell}>{km(flight.task.scoringDistanceKm)}</td>
    <td />
  </FlightRow>
);

const GliderRow = ({ stats }: { stats: ClubGliderStats }) => {
  const [expanded, setExpanded] = useState(false);
  const { glider, flights, avgSpeedKph, scoringKm } = stats;
  const name = `${glider.name} ${glider.compNo}`;
  const flown = flights.length > 0;
  const toggle = () => setExpanded(!expanded);
  return (
    <>
      <tr
        className={`border-b border-gray-100 ${
          flown ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""
        }`}
        onClick={flown ? toggle : undefined}
      >
        <td className="px-4 py-2 whitespace-nowrap">
          <span className="font-medium text-gray-900">{name}</span>{" "}
          <span className="text-xs text-gray-500">{glider.registration}</span>
        </td>
        {/* Left-aligned, as the expanded flights' pilots and routes are */}
        <td className="px-4 py-2 tabular-nums text-gray-700">
          {flights.length}
        </td>
        <td className={cell}>{kph(avgSpeedKph)}</td>
        <td className={cell}>{km(scoringKm)}</td>
        <td className="py-2 pr-4">
          {flown && (
            <ExpandButton
              expanded={expanded}
              onToggle={toggle}
              label={`Flights in ${name}`}
            />
          )}
        </td>
      </tr>
      {expanded &&
        flights.map((flight) => (
          <GliderFlightRow key={flight.id} flight={flight} />
        ))}
    </>
  );
};

/** How much each club glider was flown cross-country; a row expands to its flights. */
const ClubGliders = ({ stats }: { stats: ClubGliderStats[] }) => (
  <section aria-labelledby="club-gliders" className="flex flex-col gap-2">
    <h2 id="club-gliders" className="text-lg font-semibold text-gray-900">
      Club gliders
    </h2>
    <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
      {/* Fixed column widths, so expanding a glider's flights (which span the
          first two columns) doesn't shift the columns */}
      <table className="w-full min-w-[40rem] table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <Th width="w-[35%]">Glider</Th>
            <Th>Flights</Th>
            <Th align="right" width="w-28">
              Avg speed
            </Th>
            <Th align="right" width="w-28">
              Distance
            </Th>
            <Th width="w-10" />
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <GliderRow key={s.glider.registration} stats={s} />
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default ClubGliders;
