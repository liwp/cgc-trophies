import { AlertTriangle } from "lucide-react";
import Tooltip from "./Tooltip";
import { useHeightLoss } from "../lib/useHeightLoss";

const HeightLossWarning = ({
  flightId,
  reportedHeightLoss,
}: {
  flightId: string;
  reportedHeightLoss: number;
}) => {
  const { result, isLoading } = useHeightLoss(flightId);

  if (isLoading || !result) return null;
  if (result.heightLoss <= 1000) return null;
  if (reportedHeightLoss > 1000) return null;

  return (
    <Tooltip
      text={`Computed height loss: ${Math.round(result.heightLoss)}m (reported: ${Math.round(reportedHeightLoss)}m)`}
    >
      <AlertTriangle size={16} className="text-red-500" />
    </Tooltip>
  );
};

export default HeightLossWarning;
