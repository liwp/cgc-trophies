import { useRouter } from "next/router";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

const Trophy = () => {
  const router = useRouter();
  const [season, trophy] = router.query.param || [];
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
