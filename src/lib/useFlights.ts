import { useRouter } from "next/router";
import { useEffect } from "react";
import useSWR from "swr";
import config from "../../trophies.config";
import type { Flight } from "../types";
import { fetchFlights } from "./fetchFlights";

function currentSeason(): number {
  const now = new Date();
  const startOfSeason = new Date(now.getFullYear(), 2, 1);
  return startOfSeason < now ? now.getFullYear() : now.getFullYear() - 1;
}

function useFlights(): {
  error: any;
  flights: Flight[] | undefined;
  allFlights: Flight[] | undefined;
  isLoading: boolean;
  season: number;
} {
  const router = useRouter();
  let season = parseInt(router.query.season as string, 10);
  if (Number.isNaN(season)) {
    season = currentSeason();
  }

  useEffect(() => {
    if (
      router.isReady &&
      Number.isNaN(parseInt(router.query.season as string, 10))
    ) {
      router.replace({
        query: { ...router.query, season },
      });
    }
  }, [router, router.isReady, season]);

  const [startYear, endYear] = [season - 1, season + 1];
  const { data, error, isLoading } = useSWR(
    ["flights", startYear, endYear],
    () => fetchFlights(startYear, endYear),
  );

  const allFlights = data?.filter((f) => f.clubName === config.club.name);
  const flights = allFlights?.filter(
    (f) => f.task.launchSite === config.club.launchSite,
  );

  return {
    error,
    flights,
    allFlights,
    isLoading,
    season,
  };
}

export default useFlights;
