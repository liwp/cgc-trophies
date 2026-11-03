import { useState } from "react";
import { type ClubGliderStats, routeOf } from "../lib/stats";
import type { Flight } from "../types";
import { ExpandTh, pad, Th } from "./CompactTable";
import ExpandButton from "./ExpandButton";
import { FlightSpeed, FlightSummary, flightCell, kph } from "./FlightRow";
import Route from "./Route";

const km = (v: number) => `${Math.round(v).toLocaleString("en-GB")} km`;

const sub = "text-xs text-gray-400";
const cell = `${pad} text-right tabular-nums whitespace-nowrap text-gray-700`;
/**
 * One of a glider's flights, under its row: its date, pilot and route under
 * the glider, then its speed and distance.
 */
const route = (flight: Flight) => routeOf(flight).filter(Boolean);

const GliderFlightRow = ({ flight }: { flight: Flight }) => (
  <tr className="bg-gray-50 text-gray-500">
    <FlightSummary
      flight={flight}
      detail={<Route route={route(flight)} className="text-left" />}
      phoneDetail={route(flight).join(" – ")}
    />
    <td className={flightCell}>
      <FlightSpeed flight={flight} />
    </td>
    <td className={flightCell}>{km(flight.task.scoringDistanceKm)}</td>
    <td />
  </tr>
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
        className={`border-b border-gray-100 align-top ${
          flown ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""
        }`}
        onClick={flown ? toggle : undefined}
      >
        <td className={pad}>
          <div className="truncate font-medium text-gray-900">{name}</div>
          <div className={`${sub} truncate`}>
            {/* A phone has the comp number in the name, and no room for both. */}
            <span className="hidden sm:inline">{glider.registration} · </span>
            <span className="tabular-nums">{flights.length}</span>{" "}
            {flights.length === 1 ? "flight" : "flights"}
          </div>
        </td>
        <td className={cell}>{kph(avgSpeedKph)}</td>
        <td className={cell}>{km(scoringKm)}</td>
        <td className="py-2 pr-1.5 sm:pr-4">
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
      {/* Fixed widths, so expanding a glider can't move the columns; the
          glider column takes the rest. It fits a phone; the card still
          scrolls if a screen is too narrow even for that. */}
      <table className="w-full min-w-72 table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <Th width="">Glider</Th>
            {/* Room for "Not completed" under a glider's flights. */}
            <Th right width="w-24 sm:w-32">
              Avg speed
            </Th>
            <Th right width="w-20 sm:w-24">
              Distance
            </Th>
            <ExpandTh width="w-7 sm:w-12" />
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
