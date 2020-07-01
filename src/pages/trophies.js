import { trophyEval } from "./eval";
import TROPHIES from "./cgc_trophies";

export default ({ flights, season, trophy }) => {
  const { description, expr, name } = TROPHIES[trophy];
  const results = trophyEval(flights, expr);

  return (
    <div>
      <h1 className="text-purple-500 leading-normal">
        Cambridge Gliding Centre Trophies
      </h1>
      <h2>
        {season} - {name}
      </h2>
      <p>{description}</p>
      <h3>Results</h3>
      <ul>
        {results.map((r) => (
          <li key={r.id}>
            {r.pilot} - {r._score}
          </li>
        ))}
      </ul>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
};
