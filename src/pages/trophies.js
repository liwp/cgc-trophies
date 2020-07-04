import { trophyEval } from "./eval";
import TROPHIES from "./cgc_trophies";

// TODO:
// - render results in a table?
// - style link
// - remove JSON dump
// - pass trophy object into the component?

export default ({ flights, trophy, year }) => {
  const { description, expr, name } = TROPHIES[trophy];
  const results = trophyEval(flights, expr);

  return (
    <div>
      <h1 className="text-purple-500 leading-normal">
        Cambridge Gliding Centre Trophies
      </h1>
      <h2>
        {year} - {name}
      </h2>
      <p>{description}</p>
      <h3>Results</h3>
      <ul>
        {results.map((r) => (
          <li key={r.id}>
            {r.pilot} - {r.date.toISOString()} - {r._score} -{" "}
            <a
              target="_blank"
              href={`https://www.bgaladder.net/flightdetails/${r.id}`}
            >
              BGA Ladder
            </a>
          </li>
        ))}
      </ul>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
};
