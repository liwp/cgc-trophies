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

function seasonDates(year, seasonConfig) {
  const startOfYear = new Date(`${year}-01-01`);

  // left-pad with 0
  const [month, day] = [seasonConfig.month, seasonConfig.day].map((n) =>
    `0${n}`.slice(-2)
  );
  const start = new Date(`${year}-${month}-${day}`);

  if (startOfYear < start) {
    start.setFullYear(start.getFullYear() - 1);
  }

  const end = new Date(`${start.getFullYear() + 1}-${month}-${day}`);
  if (end < start) {
    start.setFullYear(start.getFullYear() - 1);
  }
  return [start, end];
}

const Layout = ({ children }) => (
  <div className="p-4 shadow rounded bg-white">{children}</div>
);

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  let { year = THIS_YEAR, trophy = TROPHIES.config.default } = router.query;

  console.log("QUERY", { year, trophy });

  const [start, end] = seasonDates(year, TROPHIES.config.seasonStart);
  const { data, error } = useSWR(
    `/api/flights?start=${start.toISOString()}&end=${end.toISOString()}`,
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
            <a>main page</a>
          </Link>
        </div>
      </Layout>
    );

  const { flights } = data;

  const results = trophyEval(flights, trophyConfig.expr);

  const trophies = Object.values(TROPHIES.trophies).map((trophy) => ({
    ...trophy,
    results: trophyEval(flights, trophy.expr),
    year,
  }));

  pageProps = { results, year, trophies, trophy, ...pageProps };

  return (
    <div className="p-4 shadow rounded bg-white">
      <Component {...pageProps} />
    </div>
  );
};

export default MyApp;
