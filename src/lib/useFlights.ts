import { useRouter } from "next/router";
import { useEffect } from "react";
import useSWR from "swr";
import type { Flight } from "../types";

const THIS_YEAR = new Date().getFullYear();

function fetcher(url: string) {
  return fetch(url)
    .then((res) => res.json())
    .then((data) => ({
      ...data,
      flights: data.flights.map((flight: any) => ({
        ...flight,
        date: new Date(flight.date),
      })),
    }));
}

function currentSeason(): number {
  const now = new Date();
  const startOfSeason = new Date(now.getFullYear(), 2, 1);
  return startOfSeason < now ? now.getFullYear() : now.getFullYear() - 1;
}

function useFlights(): {
  error: any;
  flights: Flight[] | undefined;
  isLoading: boolean;
  season: number;
} {
  const router = useRouter();
  let season = parseInt(router.query.season as string);
  if (isNaN(season)) {
    season = currentSeason();
  }

  useEffect(() => {
    if (router.isReady && isNaN(parseInt(router.query.season as string))) {
      router.replace({
        query: { ...router.query, season },
      });
    }
  }, [router, router.isReady, season]);

  const [startYear, endYear] = [season - 1, season + 1];
  const { data, error, isLoading } = useSWR(
    `/api/flights?start=${startYear}&end=${endYear}`,
    fetcher,
  );

  const flights =
    !isLoading && !error
      ? data.flights.filter(
          (f: Flight) => f.task.launchSite === "Gransden Lodge",
        )
      : undefined;

  return {
    error,
    flights,
    isLoading,
    season,
  };
}

export default useFlights;
