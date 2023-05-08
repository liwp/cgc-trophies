import Link from "next/link";

function UnknownTrophy({ trophyId }) {
  return (
    <div>
      <div>
        Unknown trophy: <em>{trophyId}</em>.
      </div>
      <div>
        Return back to the <Link href="/">main page</Link>
      </div>
    </div>
  );
}

export default UnknownTrophy;
