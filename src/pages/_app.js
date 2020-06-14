import { useRouter } from "next/router";
import "../styles/index.css";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const { season = new Date().getFullYear(), trophy } = router.query;
  console.log("APP PARAMS", { season, trophy }, router.query);
  return (
    <div className="p-4 shadow rounded bg-white">
      <button onClick={() => console.log("CLicK")}>Click</button>
      <Component {...pageProps} />
    </div>
  );
}
