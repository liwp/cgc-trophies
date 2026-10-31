import { useMemo } from "react";
import { Link } from "react-router-dom";

import CONFIG from "trophies-config";
import FlightLoadFailure from "../components/FlightLoadFailure";
import Loading from "../components/Loading";
import PageLayout from "../components/PageLayout";
import PageNav from "../components/PageNav";
import Season from "../components/Season";
import Stats from "../components/Stats";
import Th from "../components/Th";
import { evaluateTrophy, winnerName, winnerScore } from "../lib/results";
import { resolveTrophies } from "../lib/trophyHistory";
import useFlights from "../lib/useFlights";
import type { Flight } from "../types";

type Evaluated = ReturnType<typeof evaluateTrophy>;

const TrophyName = ({
  evaluated: { trophy },
  season,
}: {
  evaluated: Evaluated;
  season: number;
}) => (
  <>
    <Link
      to={`/trophy/${trophy.id}?season=${season}`}
      className="font-medium text-cambridge hover:text-cambridge-dark transition-colors"
    >
      {trophy.name}
    </Link>
    <div className="text-xs text-gray-400 mt-0.5">{trophy.summary}</div>
  </>
);

const Winner = ({ evaluated }: { evaluated: Evaluated }) =>
  winnerName(evaluated) ?? (
    <span className="text-gray-400 italic">No qualifying flights</span>
  );

const TrophyList = ({
  flights,
  allFlights,
  season,
}: {
  flights: Flight[];
  allFlights: Flight[];
  season: number;
}) => {
  const trophies = useMemo(
    () =>
      resolveTrophies(season).map((trophy) =>
        evaluateTrophy(trophy, season, { flights, allFlights }),
      ),
    [season, flights, allFlights],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="hidden w-full table-auto border-collapse sm:table">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <Th>Trophy</Th>
            <Th>Winner</Th>
            <Th align="right">Score</Th>
          </tr>
        </thead>
        <tbody>
          {trophies.map((evaluated) => (
            <tr
              key={evaluated.trophy.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3">
                <TrophyName evaluated={evaluated} season={season} />
              </td>
              <td className="px-4 py-3 text-gray-700">
                <Winner evaluated={evaluated} />
              </td>
              <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                {winnerScore(evaluated) ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="sm:hidden">
        {trophies.map((evaluated) => (
          <li
            key={evaluated.trophy.id}
            className="flex flex-col gap-0.5 border-t border-gray-100 px-3 py-2.5 first:border-t-0"
          >
            <TrophyName evaluated={evaluated} season={season} />
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-gray-700">
                <Winner evaluated={evaluated} />
              </span>
              <span className="text-gray-500 whitespace-nowrap">
                {winnerScore(evaluated) ?? ""}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TrophiesPage = () => {
  const state = useFlights();

  if (state.status === "error") return <FlightLoadFailure />;
  if (state.status === "loading") return <Loading />;
  const { season, flights, allFlights } = state;

  return (
    <PageLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {CONFIG.club.shortName} {season} Trophies
          </h1>
          <div className="flex items-center gap-4">
            <Season season={season} />
            <PageNav current="home" season={season} />
          </div>
        </div>
        <Stats flights={flights} season={season} />
        <TrophyList flights={flights} allFlights={allFlights} season={season} />
      </div>
    </PageLayout>
  );
};

export default TrophiesPage;
