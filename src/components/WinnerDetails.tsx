import { BarChart3, Map } from "lucide-react";
import type { FlightDetail, SingleFlightDetail } from "../lib/trophyCopyData";
import Tooltip from "./Tooltip";

const FlightTable = ({ flights }: { flights: FlightDetail[] }) => (
  <table className="text-xs">
    <tbody>
      {flights.map((f) => (
        <tr key={f.ladderUrl}>
          <td className="px-1">{f.date.toLocaleDateString()}</td>
          <td className="px-1">{f.task}</td>
          <td className="px-1 text-right">
            <Tooltip text="Scoring distance">
              <span>{f.distanceKm.toFixed(0)} km</span>
            </Tooltip>
          </td>
          <td className="px-1 text-right">
            <Tooltip text="Handicapped speed">
              <span>{f.speedKph.toFixed(1)} kph</span>
            </Tooltip>
          </td>
          <td className="px-1 text-right">
            <Tooltip text="Cross-country points">
              <span>{f.points.toFixed(0)} pts</span>
            </Tooltip>
          </td>
          <td className="px-1">
            <span className="inline-flex items-center gap-1">
              <a
                href={f.ladderUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <BarChart3 size={12} className="align-middle" />
              </a>
              <a
                href={f.igcUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Map size={12} className="align-middle" />
              </a>
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const FlightSummary = ({ flight }: { flight: SingleFlightDetail }) => {
  const { score } = flight;
  const isDistanceScore = score.unit === "km";
  const isSpeedScore = score.unit === "kph";
  const isPtsScore = score.unit === "pts";

  const distanceKm = isDistanceScore
    ? flight.handicappedDistanceKm
    : flight.scoringDistanceKm;
  const distanceLabel = isDistanceScore
    ? "Handicapped distance"
    : "Scoring distance";

  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-xs">
      <span>{flight.date.toLocaleDateString()}</span>
      <span className="text-gray-500">·</span>
      <span>{flight.task}</span>
      <span className="text-gray-500">·</span>
      <Tooltip text="Handicapped speed">
        <span className={isSpeedScore ? "font-bold" : ""}>
          {flight.handicappedSpeedKph.toFixed(1)} kph
        </span>
      </Tooltip>
      <span className="text-gray-500">·</span>
      <Tooltip text={distanceLabel}>
        <span className={isDistanceScore ? "font-bold" : ""}>
          {distanceKm.toFixed(1)} km
        </span>
      </Tooltip>
      <span className="text-gray-500">·</span>
      {isPtsScore && (
        <>
          <span className="font-bold">{score.value.toFixed(0)} pts</span>
          <span className="text-gray-500">·</span>
        </>
      )}
      <span>
        {flight.gliderReg} · {flight.gliderType}
      </span>
      <span className="inline-flex items-center gap-1">
        <a
          href={flight.ladderUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <BarChart3 size={12} className="align-middle" />
        </a>
        <a
          href={flight.igcUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Map size={12} className="align-middle" />
        </a>
      </span>
    </span>
  );
};

const WinnerDetails = ({
  flights,
  flightDetail,
}: {
  flights?: FlightDetail[];
  flightDetail?: SingleFlightDetail;
}) => (
  <div className="pl-4 pr-4 pb-3 pt-1">
    {flights ? (
      <FlightTable flights={flights} />
    ) : flightDetail ? (
      <FlightSummary flight={flightDetail} />
    ) : null}
  </div>
);

export default WinnerDetails;
