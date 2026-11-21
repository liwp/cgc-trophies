import { Medal } from "lucide-react";
import { bestMedal, type Place, placeName } from "../lib/medals";
import type { Flight } from "../types";
import { useFlightDetails } from "./FlightDetails";
import Tip from "./Tip";

const colour: Record<Place, string> = {
  1: "text-amber-500",
  2: "text-gray-400",
  3: "text-orange-700",
};

/** A gold, silver or bronze medal; decorative, so name it alongside. */
export const MedalIcon = ({
  place,
  size = 14,
}: {
  place: Place;
  size?: number;
}) => <Medal size={size} aria-hidden className={`shrink-0 ${colour[place]}`} />;

/**
 * A flight's best trophy podium medal, for its table row, with a tooltip
 * naming every trophy it has that place on. Nothing for a flight on no
 * podium.
 */
export const RowMedal = ({ flight }: { flight: Flight }) => {
  const { podiums } = useFlightDetails();
  const best = bestMedal(podiums.get(flight.id));
  if (!best) return null;
  return (
    <Tip
      tip={best.trophyNames.map((name) => (
        <span key={name} className="block">
          {name}
        </span>
      ))}
      className="inline-flex align-[-2px]"
    >
      <MedalIcon place={best.place} />
      <span className="sr-only">
        {placeName[best.place]}: {best.trophyNames.join(", ")}
      </span>
    </Tip>
  );
};
