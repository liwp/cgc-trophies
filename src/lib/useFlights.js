import { useRouter } from "next/router";
import { useEffect } from "react";
import useSWR from "swr";

const THIS_YEAR = new Date().getFullYear();

function fetcher(url) {
  return fetch(url)
    .then((res) => res.json())
    .then((data) => ({
      ...data,
      flights: data.flights.map((flight) => ({
        ...flight,
        // Convert flight date to a JS Date object
        date: new Date(flight.date),
      })),
    }));
}

function currentSeason() {
  const now = new Date();
  // 1st March
  const startOfSeason = new Date(now.getFullYear(), 2, 1);
  // If `now` is before 1st March, default to the previous year as `season`, eg 2022 instead of 2023
  return startOfSeason < now ? now.getFullYear() : now.getFullYear() - 1;
}

function useFlights() {
  const router = useRouter();
  let season = parseInt(router.query.season);
  if (isNaN(season)) {
    season = currentSeason();
  }

  useEffect(() => {
    if (router.isReady && isNaN(parseInt(router.query.season))) {
      router.replace({
        query: { ...router.query, season },
      });
    }
  }, [router, router.isReady, season]);

  // TODO: just request three years, skip future year when startYear == THIS_YEAR
  const [startYear, endYear] = [season - 1, season + 1];

  const { data, error, isLoading } = useSWR(
    `/api/flights?start=${startYear}&end=${endYear}`,
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    season,
  };
}

export default useFlights;
