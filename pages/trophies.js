import Link from "next/link";

export default () => {
  return (
    <div className="p-4 shadow rounded bg-white">
      <h1 className="text-purple-500 leading-normal">
        Cambridge Gliding Centre Trophies
      </h1>
      <Link href="/trophy/[...param]" as="/trophy/2020/test">
        <a>First Trophy</a>
      </Link>
    </div>
  );
};
