// Links to a flight on the BGA Ladder.

/** The flight's details page on the BGA Ladder site. */
export function flightDetailsUrl(flightId: string): string {
  return `https://www.bgaladder.net/flightdetails/${flightId}`;
}

/** The flight's IGC trace file (CORS-enabled; fetched for height-loss checks). */
export function igcFileUrl(flightId: string): string {
  return `https://api.bgaladder.net/api/FlightIGC/${flightId}`;
}

/** The BGA IGC viewer showing the flight's trace. */
export function igcViewerUrl(flightId: string): string {
  return `https://igcviewer.bgaladder.net/?igc=${igcFileUrl(flightId)}`;
}
