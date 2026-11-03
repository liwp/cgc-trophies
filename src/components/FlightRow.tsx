import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { flightDetailsUrl } from "../lib/links";
import { hasSpeed, isCompletedTask } from "../lib/stats";
import { formatPilotName, shortPilotName } from "../lib/trophyCopyData";
import type { Flight } from "../types";
import { dateText, ShortDate } from "./CompactTable";
import Tooltip from "./Tooltip";

/** Shows a height loss penalty on hover, or focus for keyboard users. */
export const PenaltyWarning = ({ flight }: { flight: Flight }) => {
  const { heightLoss, distancePenaltyKm } = flight.task;
  if (distancePenaltyKm <= 0) return null;
  return (
    <Tooltip
      text={`Height loss ${heightLoss.toLocaleString("en-GB")} m: ${distancePenaltyKm.toFixed(1)} km distance penalty`}
      align="right"
      asLabel
    >
      <button
        type="button"
        className="inline-flex cursor-default align-[-2px]"
        onClick={(e) => e.stopPropagation()}
      >
        <AlertTriangle size={14} className="text-amber-500" aria-hidden />
      </button>
    </Tooltip>
  );
};

/**
 * A link to a flight on the ladder, named by its pilot: an initial and surname
 * on a phone, the full name wider. Screen readers always get the full name.
 */
export const PilotLink = ({ flight }: { flight: Flight }) => {
  const name = formatPilotName(flight.pilot);
  return (
    <a
      href={flightDetailsUrl(flight.id)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      title={name}
      className="text-cambridge hover:text-cambridge-dark"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="sm:hidden">{shortPilotName(flight.pilot)}</span>
      <span className="hidden sm:inline">{name}</span>
    </a>
  );
};

export const kph = (v: number | null) =>
  v === null ? "" : `${v.toFixed(1)} kph`;

/**
 * A flight's handicapped speed, if it completed its task and the ladder timed
 * it, and any penalty.
 */
export const FlightSpeed = ({ flight }: { flight: Flight }) => {
  const { task } = flight;
  return (
    <span className="inline-flex items-center gap-1.5">
      <PenaltyWarning flight={flight} />
      {hasSpeed(flight) ? (
        kph(task.handicappedSpeedKph)
      ) : isCompletedTask(flight) ? (
        // The ladder sometimes gives a completed task no time, so no speed.
        <span className="text-gray-400 italic">Completed</span>
      ) : (
        <span className="text-gray-400 italic">Not completed</span>
      )}
    </span>
  );
};

/**
 * The first cell of a flight under an expanded stats row. Where there's room,
 * the date, pilot and `detail` sit in a line. A phone has two lines: the
 * pilot, then the date and `phoneDetail` (or `detail`) in small grey across
 * the whole row, so nothing is hidden.
 */
export const FlightSummary = ({
  flight,
  detail,
  phoneDetail = detail,
}: {
  flight: Flight;
  detail: ReactNode;
  phoneDetail?: ReactNode;
}) => (
  <td className="py-1.5 pr-1.5 pl-4 sm:pr-4 sm:pl-10">
    <div className="sm:hidden">
      <div className="truncate">
        <PilotLink flight={flight} />
      </div>
      {/* Wider than its cell, running on under the speed and distance, which
          only take the first line: the card's width less its padding. */}
      <div className="w-[calc(100vw-5rem)] text-xs text-gray-400">
        <span className="tabular-nums">
          {dateText(flight.date, { day: "numeric", month: "short" })}
        </span>{" "}
        · {phoneDetail}
      </div>
    </div>
    <div className="hidden sm:grid sm:grid-cols-[5.5rem_9rem_minmax(0,1fr)] sm:gap-x-4">
      <span className="tabular-nums">
        <ShortDate date={flight.date} />
      </span>
      <span className="truncate">
        <PilotLink flight={flight} />
      </span>
      <span className="text-gray-400">{detail}</span>
    </div>
  </td>
);

/** A flight's speed and distance cells line up with its pilot. */
export const flightCell =
  "px-1.5 py-1.5 text-right tabular-nums whitespace-nowrap align-top sm:px-4 sm:align-middle";
