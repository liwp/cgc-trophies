import { sample, uniqBy } from "lodash";
import Image from "next/image";

import TROPHIES from "../lib/cgc_trophies";
import { trophyEval } from "../lib/eval";

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
      <a
        className="hover:underline text-purple-500"
        target="_blank"
        href={`https://www.bgaladder.net/flightdetails/${id}`}
      >
        BGA Ladder
      </a>
    </li>
  );
};

const TrophyImage = ({ image }) => {
  return !!image ?
    <Image
      alt="trophy photo"
      className="float-right h-24"
      src={image}
      height="200"
      width="200" />
    : null;
};

const TrophyPage = ({ flights, season, trophies, trophy }) => {
  const config = TROPHIES.trophies.find(({ name }) => name === trophy);
  if (!config)
    return (
      <div>
        <div>
          Unknown trophy: <em>{trophy}</em>.
        </div>
        <div>
          Return back to the{" "}
          <Link href="/">
            main page
          </Link>
        </div>
      </div>
    );

  const results = trophyEval(TROPHIES.config, season, flights, config);

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
