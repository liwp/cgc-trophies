import { BarChart3, Map as MapIcon } from "lucide-react";
import { flightDetailsUrl, igcViewerUrl } from "../lib/links";
import Tooltip from "./Tooltip";

const linkClass = "text-gray-400 hover:text-cambridge transition-colors";

/** An icon link to a flight's BGA Ladder page, named by its tooltip. */
export const LadderLink = ({
  flightId,
  iconSize = 16,
  inline = false,
}: {
  flightId: string;
  iconSize?: number;
  inline?: boolean;
}) => (
  <Tooltip text="BGA Ladder" asLabel>
    <a
      href={flightDetailsUrl(flightId)}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      <BarChart3 size={iconSize} className={inline ? "inline" : undefined} />
    </a>
  </Tooltip>
);

/** Icon links to a flight's BGA Ladder page and its trace in the IGC viewer. */
const FlightLinks = ({
  flightId,
  iconSize = 16,
  inline = false,
}: {
  flightId: string;
  iconSize?: number;
  /** Render the icons inline, aligning them in the compact per-flight rows. */
  inline?: boolean;
}) => {
  const iconClass = inline ? "inline" : undefined;
  return (
    <>
      <LadderLink flightId={flightId} iconSize={iconSize} inline={inline} />
      <Tooltip text="IGC Viewer" asLabel>
        <a
          href={igcViewerUrl(flightId)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          <MapIcon size={iconSize} className={iconClass} />
        </a>
      </Tooltip>
    </>
  );
};

export default FlightLinks;
