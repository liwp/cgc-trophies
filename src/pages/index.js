import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import TROPHIES from "../lib/cgc_trophies";
import { trophyEval } from "../lib/eval";

// TODO: can we share a component with the trophy page for rendering the pilot?
// TODO: should we have a link to the BGA Ladder here?
const TrophyWinner = ({ trophy }) => {
  const { name, results, season } = trophy;
  const result = results[0];

  return (
    <Link
      href={{
        pathname: "/trophies",
        query: { season, trophy: name },
      }}
      legacyBehavior>
      <span>
        {name}: {!!result ? results[0].pilot : "No qualifying flights"}
      </span>
    </Link>
  );
};

const TrophyList = ({ flights, season }) => {
  const trophies = Object.values(TROPHIES.trophies).map((trophy) => ({
    ...trophy,
    results: trophyEval(TROPHIES.config, season, flights, trophy),
    season,
  }));

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
