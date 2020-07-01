import { useRouter } from "next/router";
import useSWR from "swr";

import "../styles/index.css";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const {
    season = new Date().getFullYear(),
    trophy = "slazenger",
  } = router.query;

  // TODO: for CGC we need to do our magic season stuff...
  const { data, error } = useSWR(`/api/flights/${season}`, fetcher);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  const { flights } = data;
  pageProps = { flights, season, trophy, ...pageProps };

  return (
    <div className="p-4 shadow rounded bg-white">
      <Component {...pageProps} />
    </div>
  );
}
