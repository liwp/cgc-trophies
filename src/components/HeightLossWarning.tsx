import { AlertTriangle } from "lucide-react";
import { shouldWarnHeightLoss } from "../lib/heightLoss";
import { useHeightLoss } from "../lib/useHeightLoss";
import Tooltip from "./Tooltip";

const HeightLossWarning = ({
  flightId,
  reportedHeightLoss,
  comparedTo = "reported",
}: {
  flightId: string;
  reportedHeightLoss: number;
  /** What reportedHeightLoss is, for the tooltip */
  comparedTo?: "reported" | "limit";
}) => {
  const { result, isLoading } = useHeightLoss(flightId);

  if (isLoading || !result) return null;
  if (!shouldWarnHeightLoss(result.heightLoss, reportedHeightLoss)) return null;

  return (
    <Tooltip
      text={`Computed height loss: ${Math.round(result.heightLoss)}m (${comparedTo}: ${Math.round(reportedHeightLoss)}m)`}
      asLabel
    >
      {/* A toggletip: a button so keyboard users can focus it to reveal the
          tooltip, whose text is also the warning's accessible name. */}
      <button type="button" className="inline-flex cursor-default">
        <AlertTriangle size={16} className="text-red-500" aria-hidden="true" />
      </button>
    </Tooltip>
  );
};

export default HeightLossWarning;
