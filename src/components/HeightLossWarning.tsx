import { AlertTriangle } from "lucide-react";
import { shouldWarnHeightLoss } from "../lib/heightLoss";
import { useHeightLoss } from "../lib/useHeightLoss";
import Tooltip from "./Tooltip";

const HeightLossWarning = ({
  flightId,
  reportedHeightLoss,
}: {
  flightId: string;
  reportedHeightLoss: number;
}) => {
  const { result, isLoading } = useHeightLoss(flightId);

  if (isLoading || !result) return null;
  if (!shouldWarnHeightLoss(result.heightLoss, reportedHeightLoss)) return null;

  return (
    <Tooltip
      text={`Computed height loss: ${Math.round(result.heightLoss)}m (reported: ${Math.round(reportedHeightLoss)}m)`}
    >
      <AlertTriangle size={16} className="text-red-500" />
    </Tooltip>
  );
};

export default HeightLossWarning;
