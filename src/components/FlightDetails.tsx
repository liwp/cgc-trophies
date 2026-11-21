import { X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { formatDate } from "../lib/formatDate";
import { type Podium, placeName } from "../lib/medals";
import { formatScore } from "../lib/results";
import { hasSpeed, isCompletedTask } from "../lib/stats";
import { formatPilotName } from "../lib/trophyCopyData";
import { entryState } from "../lib/useExpanded";
import type { Flight } from "../types";
import { LadderLink } from "./FlightLinks";
import { kph, PenaltyWarning } from "./FlightRow";
import { MedalIcon } from "./Medal";

type FlightDetailsContext = {
  /** Show a flight's details in the pop-up. */
  open: (flight: Flight) => void;
  /** Each flight id's trophy podium places, best first. */
  podiums: Map<string, Podium[]>;
  /** The season the places are for, for links to its trophy pages. */
  season: number;
};

const Context = createContext<FlightDetailsContext>({
  open: () => {},
  podiums: new Map(),
  season: 0,
});

export const useFlightDetails = () => useContext(Context);

/** A speed, or why there isn't one, as the stats tables show it. */
const speed = (flight: Flight, value: number) =>
  hasSpeed(flight) ? (
    kph(value)
  ) : (
    <span className="text-gray-400 italic">
      {isCompletedTask(flight) ? "Completed" : "Not completed"}
    </span>
  );

const Detail = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex justify-between gap-4">
    <dt className="text-gray-500">{label}</dt>
    <dd className="text-right tabular-nums text-gray-900">{children}</dd>
  </div>
);

const Details = ({
  flight,
  headingId,
  onClose,
}: {
  flight: Flight;
  headingId: string;
  onClose: () => void;
}) => {
  const { glider, task } = flight;
  const { season, podiums: places } = useContext(Context);
  const podiums = places.get(flight.id) ?? [];
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 id={headingId} className="min-w-0 font-semibold text-gray-900">
          {formatPilotName(flight.pilot)}
          <span className="block text-sm font-normal text-gray-500">
            {formatDate(flight.date)}
          </span>
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          <PenaltyWarning flight={flight} side="bottom" />
          {/* Below and leftwards: above, the pop-up's edge would cut it off. */}
          <LadderLink
            flightId={flight.id}
            iconSize={18}
            side="bottom"
            align="right"
          />
          <button
            type="button"
            aria-label="Close"
            data-autofocus
            className="text-gray-400 hover:text-gray-700"
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      </div>
      <dl className="flex flex-col gap-1.5 text-sm">
        <Detail label="Glider">{glider.type}</Detail>
        <Detail label="Registration">{glider.registration}</Detail>
        <Detail label="Handicap">{glider.handicap}</Detail>
        <Detail label="Speed">{speed(flight, task.scoringSpeedKph)}</Detail>
        <Detail label="Handicapped speed">
          {speed(flight, task.handicappedSpeedKph)}
        </Detail>
        <Detail label="Points">
          {formatScore({ value: task.crossCountryPoints, unit: "pts" })}
        </Detail>
      </dl>
      {podiums.length > 0 && (
        <section aria-labelledby={`${headingId}-trophies`}>
          <h3
            id={`${headingId}-trophies`}
            className="mb-1.5 text-sm font-semibold text-gray-900"
          >
            Trophies
          </h3>
          <ul
            aria-labelledby={`${headingId}-trophies`}
            className="flex flex-col gap-1 text-sm text-gray-700"
          >
            {podiums.map(({ place, trophyId, trophyName, trophySummary }) => (
              <li key={trophyId} className="flex items-start gap-1.5">
                <span className="mt-0.5">
                  <MedalIcon place={place} />
                </span>
                {/* The trophy's page for the season, its summary underneath. */}
                <span className="min-w-0">
                  {placeName[place]} ·{" "}
                  <Link
                    to={`/trophy/${trophyId}?season=${season}`}
                    className="text-cambridge hover:text-cambridge-dark"
                  >
                    {trophyName}
                  </Link>
                  <span className="block text-xs text-gray-500">
                    {trophySummary}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

/** The query parameter naming the flight whose pop-up is open. */
export const FLIGHT_PARAM = "flight";

/**
 * Gives the stats tables a way to open a flight's details, and shows them in
 * one pop-up: a sheet along the bottom of a phone, a dialog in the middle of
 * wider screens. A native modal dialog, so Esc closes it, focus stays inside,
 * and it sits above everything else.
 *
 * The open pop-up is in the URL (`?flight=<id>`), pushed as a history entry:
 * Back from a page linked in it reopens it, Back while it's open closes it,
 * and the link can be shared.
 */
export const FlightDetailsProvider = ({
  flights,
  podiums,
  season,
  children,
}: {
  /** Every flight the pop-up could show, to find the URL's one by id. */
  flights: Flight[];
  podiums: Map<string, Podium[]>;
  season: number;
  children: ReactNode;
}) => {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const byId = useMemo(() => new Map(flights.map((f) => [f.id, f])), [flights]);
  const shown = byId.get(params.get(FLIGHT_PARAM) ?? "");
  // The flight last shown, kept after closing so the sheet slides away with
  // its content.
  const lastRef = useRef<Flight | undefined>(undefined);
  if (shown) lastRef.current = shown;
  const flight = shown ?? lastRef.current;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const headingId = useId();

  /** This page's URL with the pop-up's flight set, or removed. */
  const withFlight = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set(FLIGHT_PARAM, id);
    else next.delete(FLIGHT_PARAM);
    const search = next.toString();
    return { pathname: location.pathname, search: search && `?${search}` };
  };

  const open = (f: Flight) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    // Carries the rows the reader has expanded into the new entry.
    navigate(withFlight(f.id), {
      state: { ...(entryState() ?? {}), pushedFlight: true },
    });
  };
  const close = () => dialogRef.current?.close();

  // The dialog follows the URL: open while it names a flight, closed when
  // it doesn't (Back, or a link that left it out).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (shown && !dialog.open) {
      dialog.showModal();
      // Opening focuses the first control, and on the icons that would show
      // their tooltips straight away: start on Close instead.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!shown && dialog.open) dialog.close();
  }, [shown]);

  // Closed from within (Close, the backdrop, Esc): take the flight out of the
  // URL. Back undoes the push that opened it, so Forward can reopen it; a
  // visit that started on the pop-up's link has nothing to go back to here.
  const onClose = () => {
    if (shown) {
      if (location.state?.pushedFlight) navigate(-1);
      else navigate(withFlight(null), { replace: true });
    }
    openerRef.current?.focus();
  };

  return (
    <Context.Provider value={{ open, podiums, season }}>
      {children}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Esc is the keyboard way out */}
      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        onClose={onClose}
        // A click on the backdrop lands on the dialog itself; one on its
        // content lands on the content.
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        // On a phone the sheet slides up from the bottom edge and back down;
        // wider, the dialog fades in as it rises a little and grows to full
        // size. The backdrop fades with either; allow-discrete keeps it on screen
        // until it has slid away. At rest it has no translate at all: any
        // would make it the frame its fixed tooltips are placed in. Not for
        // those who'd rather less motion.
        className="m-auto max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-0 shadow-[0_24px_64px_-12px_rgb(0_0_0/0.3)] backdrop:bg-gray-900/40 backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0 backdrop:transition-[opacity,overlay,display] backdrop:transition-discrete backdrop:duration-300 motion-reduce:backdrop:transition-none max-sm:mb-0 max-sm:max-w-none max-sm:rounded-b-none max-sm:translate-y-full max-sm:open:translate-none max-sm:starting:open:translate-y-full max-sm:transition-[translate,overlay,display] max-sm:transition-discrete max-sm:duration-300 max-sm:ease-out max-sm:motion-reduce:transition-none sm:translate-y-2 sm:scale-[0.98] sm:opacity-0 sm:open:translate-none sm:open:scale-none sm:open:opacity-100 sm:starting:open:translate-y-2 sm:starting:open:scale-[0.98] sm:starting:open:opacity-0 sm:transition-[opacity,translate,scale,overlay,display] sm:transition-discrete sm:duration-200 sm:ease-out sm:motion-reduce:transition-none"
      >
        {flight && (
          <Details flight={flight} headingId={headingId} onClose={close} />
        )}
      </dialog>
    </Context.Provider>
  );
};
