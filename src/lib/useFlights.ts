import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useSWR from "swr";
import config from "trophies-config";
import type { Flight } from "../types";
import { fetchFlights } from "./fetchFlights";
import { selectSeasonFlights } from "./results";
import { currentSeason } from "./season";

function useFlights(): {
  error: any;
  flights: Flight[] | undefined;
  allFlights: Flight[] | undefined;
  isLoading: boolean;
  season: number;
} {
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
  const { data, error, isLoading } = useSWR(
    ["flights", startYear, endYear],
    () => fetchFlights(startYear, endYear),
  );

  const seasonFlights = data && selectSeasonFlights(data, config.club);
  const allFlights = seasonFlights?.allFlights;
  const flights = seasonFlights?.flights;

  return {
    error,
    flights,
    allFlights,
    isLoading,
    season,
  };
}

export default useFlights;
