import { ExternalLink, Eye } from "lucide-react";
import type { FlightDetail, SingleFlightDetail } from "../lib/trophyCopyData";

const FlightTable = ({ flights }: { flights: FlightDetail[] }) => (
  <table className="text-xs">
    <tbody>
      {flights.map((f) => (
        <tr key={f.ladderUrl}>
          <td className="px-1">{f.date.toLocaleDateString()}</td>
          <td className="px-1">{f.task}</td>
          <td className="px-1 text-right" title="Scoring distance">
            {f.distanceKm.toFixed(0)} km
          </td>
          <td className="px-1 text-right" title="Handicapped speed">
            {f.speedKph.toFixed(1)} kph
          </td>
          <td className="px-1 text-right" title="Cross-country points">
            {f.points.toFixed(0)} pts
          </td>
          <td className="px-1">
            <span className="inline-flex items-center gap-1">
              <a
                href={f.ladderUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} className="align-middle" />
              </a>
              <a
                href={f.igcUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye size={12} className="align-middle" />
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
      <span
        className={isSpeedScore ? "font-bold" : ""}
        title="Handicapped speed"
      >
        {flight.handicappedSpeedKph.toFixed(1)} kph
      </span>
      <span className="text-gray-500">·</span>
      <span
        className={isDistanceScore ? "font-bold" : ""}
        title={distanceLabel}
      >
        {distanceKm.toFixed(1)} km
      </span>
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
          <ExternalLink size={12} className="align-middle" />
        </a>
        <a
          href={flight.igcUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Eye size={12} className="align-middle" />
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
