import { sample, uniqBy } from "lodash";
import Image from "next/image";

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

const TrophyPage = ({ config, trophies, trophy }) => {
  const { description, expr, img, name, results, year } = trophies.find(
    ({ name }) => name === trophy
  );
  // pick random image from a selection
  const image = sample(img);

  return (
    <div>
      <h1>
        {year} - {name}
      </h1>
      <TrophyImage image={image} />
      <p>{description}</p>
      <h2>Results</h2>
      <ul>
        {uniqBy(results, "pilot").map((r) => (
          <Result key={r.id} result={r} />
        ))}
      </ul>
    </div>
  );
};

export default TrophyPage;
