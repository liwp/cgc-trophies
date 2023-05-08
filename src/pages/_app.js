import { ChakraProvider } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";

import TROPHIES from "../lib/cgc_trophies";
import { trophyEval } from "../lib/eval";

import "../styles/index.css";

const THIS_YEAR = new Date().getFullYear();

const fetcher = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((data) => ({
      ...data,
      flights: data.flights.map((flight) => ({
        ...flight,
        // Convert flight date to a JS Date object
        date: new Date(flight.date),
      })),
    }));

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  let season = parseInt(router.query.season);
  let trophy = router.query.trophy || TROPHIES.config.default;

  if (isNaN(season)) {
    season = THIS_YEAR;
  }

  console.log("QUERY", { season, trophy });

  // TODO: remove trophy query param default, or replace with path segment?
  // TODO: if `season` is not present, set to current year (from 1.3. onwards)
  // TODO: look up the flights only when the season changes

  const [startYear, endYear] = [season - 1, season + 1];

  // TODO: just request three years, skip future year when startYear == THIS_YEAR
  const { data, error } = useSWR(
    `/api/flights?start=${startYear}&end=${endYear}`,
    fetcher
  );

  if (error)
    return (
      <div>Failed to load flight data. Please try refreshing the page.</div>
    );
  if (!data) return <div>Loading flight data...</div>;

  const { flights } = data;

  pageProps = { flights, season, trophy, ...pageProps };

  return (
    <ChakraProvider>
      <Component {...pageProps} />
    </ChakraProvider>
  );
};

export default MyApp;
