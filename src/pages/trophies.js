import Link from "next/link";

export default () => {
  return (
    <div>
      <h1 className="text-purple-500 leading-normal">
        Cambridge Gliding Centre Trophies
      </h1>
      <Link
        href="/season/[season]/trophy/[trophy]"
        as="/season/2020/trophy/test"
      >
        <a>First Trophy</a>
      </Link>
    </div>
  );
};
