import { keyBy, sample, uniqBy } from "lodash";
import Image from "next/image";
import { useRouter } from "next/router";

import CGC_TROPHIES from "../../lib/cgc_trophies";
import FlightLoadFailure from "../../components/FlightLoadFailure";
import Loading from "../../components/Loading";
import UnknownTrophy from "../../components/UnknownTrophy";
import { trophyEval } from "../../lib/eval";
import useFlights from "../../lib/useFlights";

const CONFIG = CGC_TROPHIES.config;
const TROPHIES = keyBy(CGC_TROPHIES.trophies, "id");

// TODO:
// - render results in a table?

const Score = ({ value, unit }) => {
  switch (unit) {
    case "km":
    case "kph":
      value = value.toFixed(2);
      break;
    case "pts":
      value = value.toFixed(0);
  }

  return (
    <span>
      {value} {unit}
    </span>
  );
};

const Result = ({ result }) => {
  const {
    score: { unit, value },
    id,
    date,
    pilot,
  } = result;

  return (
    <li key={id}>
      <span className="capitalize">{pilot}</span> - {date.toISOString()} -{" "}
      <Score value={value} unit={unit} /> -{" "}
      <a target="_blank" href={`https://www.bgaladder.net/flightdetails/${id}`}>
        BGA Ladder
      </a>
    </li>
  );
};

const TrophyImage = ({ image }) => {
  return !!image ? (
    <Image
      alt="trophy photo"
      className="float-right h-24"
      src={image}
      height="200"
      width="200"
    />
  ) : null;
};

const TrophyPage = () => {
  const router = useRouter();
  const trophyId = router.query.trophyId;
  const { error, flights, isLoading, season } = useFlights();

  if (error) return <FlightLoadFailure />;
  if (isLoading) return <Loading />;

  const config = TROPHIES[trophyId];
  if (!config) return <UnknownTrophy trophyId={trophyId} />;

  const results = trophyEval(CONFIG, season, flights, config);

  // TODO: do we want uniqBy(results, 'pilot').map(...) here? OTOH multiple
  // results is annoying, but sometimes the first flight might be disqualified,
  // so we'd want to see the others too...

  return (
    <div>
      <h1>
        {season} - {config.name}
      </h1>
      <TrophyImage image={sample(config.img)} />
      <p>{config.description}</p>
      <h2>Results</h2>
      <ul>
        {results.map((r) => (
          <Result key={r.id} result={r} />
        ))}
      </ul>
    </div>
  );
};

export default TrophyPage;
