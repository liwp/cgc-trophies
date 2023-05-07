import { ChakraProvider } from '@chakra-ui/react';
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

const Layout = ({ children }) => (
  <div className="p-4 shadow rounded bg-white">{children}</div>
);

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  let season = parseInt(router.query.year);
  let trophy = router.query.trophy || TROPHIES.config.default;

  if (isNaN(season)) {
    season = THIS_YEAR;
  }

  console.log("QUERY", { season, trophy });

  // TODO: remove trophy query param default, or replace with path segment?
  // TODO: change `year` to `season`
  // TODO: if `season` is not present, set to current year (from 1.3. onwards)
  // TODO: look up the flights only when the season changes
  // TODO: then filter locally based on i) trophy config, or ii) default

  const [startYear, endYear] = [season - 1, season + 1];

  const { data, error } = useSWR(
    `/api/flights?start=${startYear}&end=${endYear}`,
    fetcher
  );

  if (error)
    return (
      <Layout>
        <div>Failed to load flight data. Please try refreshing the page.</div>
      </Layout>
    );
  if (!data)
    return (
      <Layout>
        <div>Loading flight data...</div>
      </Layout>
    );

  const trophyConfig = TROPHIES.trophies.find(({ name }) => name === trophy);
  if (!trophyConfig)
    return (
      <Layout>
        <div>
          Unknown trophy: <em>{trophy}</em>.
        </div>
        <div>
          Return back to the{" "}
          <Link href="/">
            main page
          </Link>
        </div>
      </Layout>
    );

  const { flights } = data;

  const results = trophyEval(flights, trophyConfig.expr);

  const trophies = Object.values(TROPHIES.trophies).map((trophy) => ({
    ...trophy,
    results: trophyEval(flights, trophy.expr),
    year: season,
  }));

  // TODO: rename year
  pageProps = { results, year: season, trophies, trophy, ...pageProps };

  return (
    <ChakraProvider>
      <Component {...pageProps} />
    </ChakraProvider>
  );
};

export default MyApp;
