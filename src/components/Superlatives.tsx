import { useState } from "react";
import { flightDetailsUrl } from "../lib/links";
import type { Superlative } from "../lib/stats";
import { formatPilotName } from "../lib/trophyCopyData";
import type { Flight } from "../types";
import ExpandButton from "./ExpandButton";

const FlightLink = ({ flight }: { flight: Flight }) => (
  <a
    href={flightDetailsUrl(flight.id)}
    target="_blank"
    rel="noopener noreferrer"
    className="truncate text-cambridge hover:text-cambridge-dark"
  >
    {formatPilotName(flight.pilot)}
  </a>
);

const FlightDetails = ({
  flight,
  detail,
}: {
  flight: Flight;
  detail: string;
}) => (
  <>
    <span className="flex text-sm">
      <FlightLink flight={flight} />
    </span>
    <span className="truncate text-xs text-gray-400">
      {detail} · {flight.glider.type}
    </span>
  </>
);

/**
 * A day's flights: a lone flight as it is, otherwise the pilot count,
 * expanding to each pilot's flight.
 */
const DayFlights = ({
  title,
  flights,
}: {
  title: string;
  flights: Flight[];
}) => {
  const [expanded, setExpanded] = useState(false);
  const pilots = new Set(flights.map((f) => f.pilot)).size;
  if (flights.length === 1) {
    const [flight] = flights;
    return (
      <FlightDetails
        flight={flight}
        detail={`${Math.round(flight.task.scoringDistanceKm)} km`}
      />
    );
  }
  return (
    <>
      <div className="flex items-center justify-between text-sm text-gray-700">
        {pilots} {pilots === 1 ? "pilot" : "pilots"}
        <ExpandButton
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          label={`${title}: all flights`}
        />
      </div>
      {expanded && (
        <ul className="mt-1 flex flex-col gap-1 text-sm">
          {flights.map((flight) => (
            <li key={flight.id} className="flex justify-between gap-3">
              <FlightLink flight={flight} />
              <span className="whitespace-nowrap text-gray-500 tabular-nums">
                {Math.round(flight.task.scoringDistanceKm)} km
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

const Card = ({ card }: { card: Superlative }) => (
  <li className="flex flex-col rounded-xl border border-gray-200 bg-white px-4 py-3">
    <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
      {card.title}
    </span>
    <span className="mt-1 text-lg font-bold whitespace-nowrap text-gray-900 tabular-nums sm:text-xl">
      {card.value}
    </span>
    {"dayFlights" in card ? (
      <DayFlights title={card.title} flights={card.dayFlights} />
    ) : card.flight ? (
      <FlightDetails
        flight={card.flight}
        detail={card.flight.date.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })}
      />
    ) : (
      <span className="truncate text-sm text-gray-700">
        {formatPilotName(card.pilot)}
      </span>
    )}
  </li>
);

/** The season's award cards. */
const Superlatives = ({ cards }: { cards: Superlative[] }) =>
  cards.length === 0 ? null : (
    <section aria-labelledby="awards" className="flex flex-col gap-2">
      <h2 id="awards" className="text-lg font-semibold text-gray-900">
        Season awards
      </h2>
      <ul className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.key} card={card} />
        ))}
      </ul>
    </section>
  );

export default Superlatives;
