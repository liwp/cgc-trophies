import config from "../../trophies.config";
import type { Flight } from "../types";
import { parseCsv } from "./csv";
import { SPEC } from "./flightCsvSpec";

const URL = "https://api.bgaladder.net/api/getlogfilescsv";

/**
 * Fetch and parse BGA Ladder flight data directly from the BGA API for the
 * given (inclusive) year range. The BGA endpoint is CORS-enabled, so this runs
 * client-side with no backend proxy.
 */
export async function fetchFlights(
  start: number,
  end: number,
): Promise<Flight[]> {
  const years = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const csvs = await Promise.all(
    years.map((year) =>
      fetch(`${URL}/${year}/${config.club.code}`).then((res) => {
        if (!res.ok) {
          throw new Error(
            `Failed to fetch flights for ${year}: ${res.status} ${res.statusText}`,
          );
        }
        return res.text();
      }),
    ),
  );

  return csvs.flatMap((csv) => parseCsv(SPEC, csv)) as Flight[];
}
