import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import useSWR from "swr";
import config from "trophies-config";
import { fetchFlights } from "./fetchFlights";
import { type SeasonFlights, selectSeasonFlights } from "./results";
import { currentSeason } from "./season";

export type FlightsState =
  | { status: "loading"; season: number }
  | { status: "error"; season: number; error: unknown }
  | ({ status: "ready"; season: number } & SeasonFlights);

/**
 * The selected season (from ?season=, defaulting to the current one) and its
 * flights. The flight arrays keep their identity between renders, so callers
 * can memoise work on them.
 */
function useFlights(): FlightsState {
  const [searchParams, setSearchParams] = useSearchParams();
  let season = parseInt(searchParams.get("season") ?? "", 10);
  if (Number.isNaN(season)) {
    season = currentSeason();
  }

  useEffect(() => {
    if (Number.isNaN(parseInt(searchParams.get("season") ?? "", 10))) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("season", String(season));
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams, season]);

  const [startYear, endYear] = [season - 1, season + 1];
  const { data, error } = useSWR(["flights", startYear, endYear], () =>
    fetchFlights(startYear, endYear),
  );

  const seasonFlights = useMemo(
    () => data && selectSeasonFlights(data, config.club),
    [data],
  );

  if (error) return { status: "error", season, error };
  if (!seasonFlights) return { status: "loading", season };
  return { status: "ready", season, ...seasonFlights };
}

export default useFlights;
