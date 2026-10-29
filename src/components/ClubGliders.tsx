import { useState } from "react";
import type { ClubGliderStats } from "../lib/stats";
import type { Flight } from "../types";
import ExpandButton from "./ExpandButton";
import FlightRow, { FlightSpeed, kph } from "./FlightRow";
import Th from "./Th";

const whole = (v: number) => Math.round(v).toLocaleString("en-GB");

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
    <td className={flightCell}>{whole(flight.task.scoringDistanceKm)}</td>
    <td className={flightCell}>{whole(flight.task.crossCountryPoints)}</td>
    <td />
  </FlightRow>
);

const GliderRow = ({ stats }: { stats: ClubGliderStats }) => {
  const [expanded, setExpanded] = useState(false);
  const { glider, flights, avgSpeedKph, scoringKm, points } = stats;
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
        <td className={cell}>{flights.length}</td>
        <td className={cell}>{kph(avgSpeedKph)}</td>
        <td className={cell}>{whole(scoringKm)}</td>
        <td className={cell}>{whole(points)}</td>
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
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <Th>Glider</Th>
            <Th align="right">Flights</Th>
            <Th align="right">Avg speed</Th>
            <Th align="right">Km</Th>
            <Th align="right">Points</Th>
            <Th />
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
