import type { TrophyResults } from "./results";

/** A podium place: gold, silver or bronze. */
export type Place = 1 | 2 | 3;

/** A flight's place on one trophy's podium. */
export interface Podium {
  place: Place;
  trophyId: string;
  trophyName: string;
}

export const placeName: Record<Place, "Gold" | "Silver" | "Bronze"> = {
  1: "Gold",
  2: "Silver",
  3: "Bronze",
};

/**
 * Each flight's podium places, by flight id, best place first (ties keep the
 * trophies' order). A place is the position in a trophy's results, as the
 * trophy pages number them. On a ladder every flight counting towards a
 * top-three total gets that total's place. Excluded flights get nothing.
 */
export function podiumPlaces(
  evaluated: TrophyResults[],
): Map<string, Podium[]> {
  const places = new Map<string, Podium[]>();
  const add = (flightId: string, podium: Podium) =>
    places.set(flightId, [...(places.get(flightId) ?? []), podium]);

  for (const e of evaluated) {
    // Each podium result's flights: the flight itself, or a ladder total's.
    const podiumFlights =
      e.type === "flight"
        ? e.results.slice(0, 3).map((flight) => [flight])
        : e.results.slice(0, 3).map((result) => result.flights);
    podiumFlights.forEach((flights, i) => {
      const podium = {
        place: (i + 1) as Place,
        trophyId: e.trophy.id,
        trophyName: e.trophy.name,
      };
      for (const flight of flights) add(flight.id, podium);
    });
  }
  // A stable sort, so equal places stay in the trophies' order.
  for (const podiums of places.values())
    podiums.sort((a, b) => a.place - b.place);
  return places;
}

/** A flight's best place and every trophy it has that place on. */
export function bestMedal(
  podiums: Podium[] | undefined,
): { place: Place; trophyNames: string[] } | undefined {
  if (!podiums?.length) return undefined;
  const place = Math.min(...podiums.map((p) => p.place)) as Place;
  return {
    place,
    trophyNames: podiums
      .filter((p) => p.place === place)
      .map((p) => p.trophyName),
  };
}
