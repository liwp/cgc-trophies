import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

// TODO: can we share a component with the trophy page for rendering the pilot?
// TODO: should we have a link to the BGA Ladder here?
const TrophyWinner = ({ trophy }) => {
  const { name, results, year } = trophy;
  const result = results[0];

  return (
    <Link
      href={{
        pathname: "/trophies",
        query: { year, trophy: name },
      }}
      legacyBehavior>
      <span>
        {name}: {!!result ? results[0].pilot : "No qualifying flights"}
      </span>
    </Link>
  );
};

const TrophyList = ({ trophies }) => {
  return (
    <ul>
      {trophies.map((trophy) => (
        <li key={trophy.name}>
          <TrophyWinner trophy={trophy} />
        </li>
      ))}
    </ul>
  );
};

export default TrophyList;
