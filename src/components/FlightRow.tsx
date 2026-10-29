import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { flightDetailsUrl } from "../lib/links";
import { formatPilotName } from "../lib/trophyCopyData";
import type { Flight } from "../types";
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
 * One flight under an expanded stats row: its date, pilot (linking to the
 * ladder) and `detail`, across the row's first `span` columns, followed by
 * the table's own cells.
 */
const FlightRow = ({
  flight,
  span,
  detail,
  children,
}: {
  flight: Flight;
  span: number;
  detail: ReactNode;
  children: ReactNode;
}) => (
  <tr className="bg-gray-50 text-gray-500">
    <td colSpan={span} className="py-1.5 pr-4 pl-10">
      <div className="grid grid-cols-[6.5rem_minmax(9rem,1fr)_1fr] gap-x-4 whitespace-nowrap">
        <span className="tabular-nums">
          {flight.date.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          })}
        </span>
        <a
          href={flightDetailsUrl(flight.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cambridge hover:text-cambridge-dark"
          onClick={(e) => e.stopPropagation()}
        >
          {formatPilotName(flight.pilot)}
        </a>
        <span className="text-gray-400">{detail}</span>
      </div>
    </td>
    {children}
  </tr>
);

export default FlightRow;
