import { X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { formatDate } from "../lib/formatDate";
import type { Podium } from "../lib/medals";
import { formatScore } from "../lib/results";
import { hasSpeed, isCompletedTask } from "../lib/stats";
import { formatPilotName } from "../lib/trophyCopyData";
import type { Flight } from "../types";
import { LadderLink } from "./FlightLinks";
import { kph, PenaltyWarning } from "./FlightRow";

type FlightDetailsContext = {
  /** Show a flight's details in the pop-up. */
  open: (flight: Flight) => void;
  /** Each flight id's trophy podium places, best first. */
  podiums: Map<string, Podium[]>;
};

const Context = createContext<FlightDetailsContext>({
  open: () => {},
  podiums: new Map(),
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
          <LadderLink flightId={flight.id} iconSize={18} />
          <button
            type="button"
            aria-label="Close"
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
    </div>
  );
};

/**
 * Gives the stats tables a way to open a flight's details, and shows them in
 * one pop-up: a sheet along the bottom of a phone, a dialog in the middle of
 * wider screens. A native modal dialog, so Esc closes it, focus stays inside,
 * and it sits above everything else.
 */
export const FlightDetailsProvider = ({
  podiums,
  children,
}: {
  podiums: Map<string, Podium[]>;
  children: ReactNode;
}) => {
  const [flight, setFlight] = useState<Flight | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const headingId = useId();

  const open = (f: Flight) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setFlight(f);
  };
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (flight && dialog && !dialog.open) dialog.showModal();
  }, [flight]);

  return (
    <Context.Provider value={{ open, podiums }}>
      {children}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Esc is the keyboard way out */}
      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        onClose={() => {
          setFlight(null);
          openerRef.current?.focus();
        }}
        // A click on the backdrop lands on the dialog itself; one on its
        // content lands on the content.
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-auto w-full max-w-md overflow-visible rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-900/40 max-sm:mb-0 max-sm:max-w-none max-sm:rounded-b-none"
      >
        {flight && (
          <Details flight={flight} headingId={headingId} onClose={close} />
        )}
      </dialog>
    </Context.Provider>
  );
};
