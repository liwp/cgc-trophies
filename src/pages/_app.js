import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";

import TROPHIES from "./cgc_trophies";
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

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  let { year = THIS_YEAR, trophy = "gransden" } = router.query;

  console.log("QUERY", { year, trophy });

  const [start, end] = seasonDates(year, TROPHIES.seasonStart);
  const { data, error } = useSWR(
    `/api/flights?start=${start.toISOString()}&end=${end.toISOString()}`,
    fetcher
  );

  // TODO: we need to apply the same template to all of these... Maybe move all
  // of this to some subcomponent.
  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;
  if (!TROPHIES[trophy])
    return (
      <Link href="/">
        <a>Home</a>
      </Link>
    );

  const { flights } = data;
  pageProps = { flights, year, trophy, ...pageProps };

  return (
    <div className="p-4 shadow rounded bg-white">
      <Component {...pageProps} />
    </div>
  );
};

export default MyApp;
