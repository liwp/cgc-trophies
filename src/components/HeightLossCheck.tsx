import { CircleCheck, CircleHelp, Gauge, LoaderCircle } from "lucide-react";
import { type MouseEvent, type ReactNode, useState } from "react";
import { shouldWarnHeightLoss } from "../lib/heightLoss";
import { useHeightLoss } from "../lib/useHeightLoss";
import HeightLossWarning from "./HeightLossWarning";
import Tooltip from "./Tooltip";

const ICON_SIZE = 14;

/** An icon-only toggletip button named by its tooltip text. */
const Status = ({
  text,
  onClick,
  children,
}: {
  text: string;
  onClick?: (e: MouseEvent) => void;
  children: ReactNode;
}) => (
  <Tooltip text={text} asLabel>
    <button
      type="button"
      className={`inline-flex p-1 rounded ${onClick ? "hover:bg-gray-100" : "cursor-default"}`}
      onClick={onClick}
    >
      {children}
    </button>
  </Tooltip>
);

/**
 * Admin height-loss check for one flight. Each check downloads the flight's
 * IGC file, so it runs straight away only when `auto` is set (for winners);
 * otherwise it waits for a click, then shows a tick or a warning.
 */
const HeightLossCheck = ({
  flightId,
  reportedHeightLoss,
  auto = false,
}: {
  flightId: string;
  reportedHeightLoss: number;
  auto?: boolean;
}) => {
  const [requested, setRequested] = useState(auto);
  const { result, isLoading } = useHeightLoss(requested ? flightId : undefined);

  if (!requested) {
    return (
      <Status
        text="Check height loss"
        onClick={(e) => {
          // Ladder rows expand on click; checking shouldn't toggle them.
          e.stopPropagation();
          setRequested(true);
        }}
      >
        <Gauge size={ICON_SIZE} className="text-gray-400" aria-hidden="true" />
      </Status>
    );
  }

  if (isLoading) {
    return (
      <Status text="Checking height loss…">
        <LoaderCircle
          size={ICON_SIZE}
          className="text-gray-400 animate-spin"
          aria-hidden="true"
        />
      </Status>
    );
  }

  if (!result) {
    return (
      <Status text="Height loss unknown: IGC file unavailable">
        <CircleHelp
          size={ICON_SIZE}
          className="text-gray-400"
          aria-hidden="true"
        />
      </Status>
    );
  }

  if (shouldWarnHeightLoss(result.heightLoss, reportedHeightLoss)) {
    return (
      <HeightLossWarning
        flightId={flightId}
        reportedHeightLoss={reportedHeightLoss}
      />
    );
  }

  return (
    <Status
      text={`Height loss OK: ${Math.round(result.heightLoss)}m (reported: ${Math.round(reportedHeightLoss)}m)`}
    >
      <CircleCheck
        size={ICON_SIZE}
        className="text-green-600"
        aria-hidden="true"
      />
    </Status>
  );
};

export default HeightLossCheck;
