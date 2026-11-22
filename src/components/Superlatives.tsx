import type { ReactNode } from "react";
import type { Superlative } from "../lib/stats";
import { formatPilotName, shortPilotName } from "../lib/trophyCopyData";
import { useExpanded } from "../lib/useExpanded";
import type { Flight } from "../types";
import ExpandButton from "./ExpandButton";
import { useFlightDetails } from "./FlightDetails";

const cardClass =
  "flex flex-col rounded-xl border border-gray-200 bg-white px-4 py-3";
const clickable = "cursor-pointer hover:bg-gray-50 transition-colors";

const km = (flight: Flight) =>
  `${Math.round(flight.task.scoringDistanceKm)} km`;

const date = (flight: Flight) =>
  flight.date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/** A card's title and headline figure. */
const Heading = ({ card }: { card: Superlative }) => (
  <>
    <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
      {card.title}
    </span>
    <span className="mt-1 text-lg font-bold whitespace-nowrap text-gray-900 tabular-nums sm:text-xl">
      {card.value}
    </span>
  </>
);

/**
 * A card for one flight: a click anywhere on it opens the flight's pop-up,
 * with its task, speed, glider and trophy places.
 */
const FlightCard = ({
  card,
  flight,
  detail,
}: {
  card: Superlative;
  flight: Flight;
  detail: string;
}) => {
  const { open } = useFlightDetails();
  return (
    <li className="flex">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => open(flight)}
        className={`${cardClass} ${clickable} w-full text-left`}
      >
        <Heading card={card} />
        <span className="truncate text-sm text-cambridge">
          {formatPilotName(flight.pilot)}
        </span>
        <span className="truncate text-xs text-gray-400">
          {detail} · {flight.glider.type}
        </span>
      </button>
    </li>
  );
};

/**
 * A card that expands in place to a list: a click anywhere on it, or its
 * chevron, opens and closes it. Kept across Back like the tables' rows.
 */
const ExpandingCard = ({
  card,
  label,
  summary,
  children,
}: {
  card: Superlative;
  /** The chevron's name, for screen readers. */
  label: string;
  /** What shows beside the chevron, open or closed. */
  summary: (expanded: boolean) => ReactNode;
  children: ReactNode;
}) => {
  const [expanded, toggle] = useExpanded(`highlight:${card.key}`);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the chevron is the keyboard way in
    <li className={`${cardClass} ${clickable}`} onClick={toggle}>
      <Heading card={card} />
      <div className="flex min-w-0 items-center gap-1.5 text-sm text-gray-700">
        <ExpandButton expanded={expanded} onToggle={toggle} label={label} />
        {summary(expanded)}
      </div>
      {expanded && children}
    </li>
  );
};

/** A day's flights, each opening its pop-up. */
const DayFlights = ({ flights }: { flights: Flight[] }) => {
  const { open } = useFlightDetails();
  return (
    <ul className="mt-1 flex flex-col gap-1 text-sm">
      {flights.map((flight) => (
        <li key={flight.id}>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={`Flight details for ${formatPilotName(flight.pilot)}`}
            onClick={(e) => {
              // The card would close too; the pop-up is what was asked for.
              e.stopPropagation();
              open(flight);
            }}
            className="-mx-1 flex w-[calc(100%+0.5rem)] justify-between gap-3 rounded px-1 text-left hover:bg-gray-100"
          >
            <span className="truncate text-cambridge">
              {formatPilotName(flight.pilot)}
            </span>
            <span className="whitespace-nowrap text-gray-500 tabular-nums">
              {km(flight)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};

/** A pilot card's top pilots, with their figures. */
const Leaders = ({
  leaders,
}: {
  leaders: { pilot: string; value: string }[];
}) => (
  <ol className="mt-1 flex flex-col gap-1 text-sm">
    {leaders.map(({ pilot, value }, i) => (
      <li key={pilot} className="flex justify-between gap-3">
        <span className="truncate text-gray-700">
          <span className="text-gray-400 tabular-nums">{i + 1}.</span>{" "}
          {/* A phone's half-width card has room for an initial and surname. */}
          <span className="sm:hidden">{shortPilotName(pilot)}</span>
          <span className="hidden sm:inline">{formatPilotName(pilot)}</span>
        </span>
        <span className="whitespace-nowrap text-gray-500 tabular-nums">
          {value}
        </span>
      </li>
    ))}
  </ol>
);

const Card = ({ card }: { card: Superlative }) => {
  if ("dayFlights" in card) {
    const flights = card.dayFlights;
    if (flights.length === 1)
      return (
        <FlightCard card={card} flight={flights[0]} detail={km(flights[0])} />
      );
    const pilots = new Set(flights.map((f) => f.pilot)).size;
    return (
      <ExpandingCard
        card={card}
        label={`${card.title}: all flights`}
        summary={() => `${pilots} ${pilots === 1 ? "pilot" : "pilots"}`}
      >
        <DayFlights flights={flights} />
      </ExpandingCard>
    );
  }
  if (card.flight)
    return (
      <FlightCard card={card} flight={card.flight} detail={date(card.flight)} />
    );
  const name = <span className="truncate">{formatPilotName(card.pilot)}</span>;
  if (!card.leaders || card.leaders.length < 2)
    return (
      <li className={cardClass}>
        <Heading card={card} />
        <span className="text-sm text-gray-700">{name}</span>
      </li>
    );
  return (
    <ExpandingCard
      card={card}
      label={`${card.title}: top pilots`}
      // Open, the list starts with the winner.
      summary={(expanded) => (expanded ? `Top ${card.leaders?.length}` : name)}
    >
      <Leaders leaders={card.leaders} />
    </ExpandingCard>
  );
};

/** The season's award cards. */
const Superlatives = ({ cards }: { cards: Superlative[] }) =>
  cards.length === 0 ? null : (
    <section aria-labelledby="highlights" className="flex flex-col gap-2">
      <h2 id="highlights" className="text-lg font-semibold text-gray-900">
        Season highlights
      </h2>
      {/* Each row as tall as its tallest card, so an open card grows only its own. */}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.key} card={card} />
        ))}
      </ul>
    </section>
  );

export default Superlatives;
