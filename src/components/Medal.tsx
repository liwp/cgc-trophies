import { Medal } from "lucide-react";
import { type Place, type Podium, placeName } from "../lib/medals";
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

/** A podium place as a line of text: "Gold · Jubilee Bowl". */
export const podiumText = ({ place, trophyName }: Podium) =>
  `${placeName[place]} · ${trophyName}`;

/**
 * A flight's best trophy podium medal, for its table row, with a tooltip
 * listing every podium place it has, each with its medal. Nothing for a
 * flight on no podium.
 */
export const RowMedal = ({ flight }: { flight: Flight }) => {
  const { podiums } = useFlightDetails();
  const places = podiums.get(flight.id) ?? [];
  if (places.length === 0) return null;
  return (
    <Tip
      tip={places.map((podium) => (
        <span key={podium.trophyId} className="flex items-center gap-1.5">
          <MedalIcon place={podium.place} />
          {podiumText(podium)}
        </span>
      ))}
      className="inline-flex align-[-2px]"
      help={false}
    >
      {/* Best first, so the row shows the best place. */}
      <MedalIcon place={places[0].place} />
      <span className="sr-only">
        Trophies: {places.map(podiumText).join(", ")}
      </span>
    </Tip>
  );
};
