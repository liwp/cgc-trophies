import { keyBy } from "lodash";
import { useParams } from "react-router-dom";
import FlightLoadFailure from "../../components/FlightLoadFailure";
import LadderResultsList from "../../components/LadderResultsList";
import Loading from "../../components/Loading";
import PageLayout from "../../components/PageLayout";
import ResultsList from "../../components/ResultsList";
import Season from "../../components/Season";
import TrophyNavBar from "../../components/TrophyNavBar";
import UnknownTrophy from "../../components/UnknownTrophy";
import { evaluateTrophy } from "../../lib/results";
import { resolveTrophies } from "../../lib/trophyHistory";
import useFlights from "../../lib/useFlights";

const TrophyPage = () => {
  const { trophyId = "" } = useParams();
  const state = useFlights();

  if (state.status === "error") return <FlightLoadFailure />;
  if (state.status === "loading") return <Loading />;
  const { season, flights, allFlights } = state;

  const config = keyBy(resolveTrophies(season), "id")[trophyId];
  if (!config) return <UnknownTrophy trophyId={trophyId} />;

  const evaluated = evaluateTrophy(config, season, { flights, allFlights });

  return (
    <PageLayout>
      <div className="flex flex-col gap-6">
        <TrophyNavBar trophyId={trophyId} season={season} />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{config.name}</h2>
          <Season season={season} />
        </div>

        <p className="text-sm text-gray-500">{config.description}</p>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {evaluated.type === "ladder" ? (
            <LadderResultsList
              results={evaluated.results}
              isSyndicate={evaluated.trophy.groupBy === "registration"}
            />
          ) : (
            <ResultsList results={evaluated.results} />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default TrophyPage;
