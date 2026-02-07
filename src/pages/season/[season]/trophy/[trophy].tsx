import { useRouter } from "next/router";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Trophy = () => {
  const router = useRouter();
  const { season = new Date().getFullYear(), trophy } = router.query;
  console.log("PARAMS", { season, trophy }, router.query);
  const { data, error } = useSWR(`/api/flights/${season}`, fetcher);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4 shadow rounded bg-white">
      <h1 className="text-purple-500 leading-normal">
        {season} - {trophy}
      </h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default Trophy;
