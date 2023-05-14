import { chain, get, isEqual, isFunction, reverse } from "lodash";

const comparators = {
  "=": (x, y) => x === y,
  "<=": (x, y) => x <= y,
  "<=>": (xs, ys) => isEqual(xs, ys) || isEqual(xs, reverse(ys)),
};

function configToDate(season, { day, month }) {
  return new Date(`${season}-${month}-${day}`);
}

function inSeasonPredicate(season, config, name) {
  let start = configToDate(season, config.start);
  let end = configToDate(season, config.end);

  if (start > end) {
    end.setFullYear(end.getFullYear() + 1);
  }

  return ({ date }) => {
    const flight = new Date(date);
    return start < flight && flight < end;
  };
}

export function trophyEval(defaultConfig, season, flights, trophy) {
  const inSeason = inSeasonPredicate(
    season,
    trophy.season || defaultConfig.season,
    trophy.name
  );

  const ignoredIds = { ...defaultConfig.ignore, ...trophy.ignore };

  // eslint-disable-next-line no-param-reassign
  flights = chain(flights)
    .filter(inSeason)
    .map((flight) => ({
      ...flight,
      ignore: ignoredIds[flight.id],
    }));

  trophy.expr.forEach(([op, ...args]) => {
    switch (op) {
      case "filter": {
        const [field, comparator = "=", value = true] = args;
        const pred = comparators[comparator];
        if (!pred) {
          throw new Error(
            `Unknown filter predicate: ${comparator} in ${op} ${args}`
          );
        }
        // eslint-disable-next-line no-param-reassign
        flights = flights.filter((flight) => pred(get(flight, field), value));
        break;
      }
      // TODO: we can replace `score` with a project which:
      // - accepts and array of keys or functions
      // - use an identity fn to return units
      // TODO: would also be nice to accept single key / function
      case "project": {
        const [field, fieldsOfProjection] = args;
        const projection = isFunction(fieldsOfProjection)
          ? fieldsOfProjection
          : (f) => fieldsOfProjection.map((key) => get(f, key));
        // eslint-disable-next-line no-param-reassign
        flights = flights.map((f) =>
          Object.assign({}, f, { [field]: projection(f) })
        );
        break;
      }
      case "score": {
        const [field, unit] = args;
        // eslint-disable-next-line no-param-reassign
        flights = flights.map((f) =>
          Object.assign({}, f, { score: { value: get(f, field), unit } })
        );
      }
      case "sort": {
        const [field, order] = args;
        // eslint-disable-next-line no-param-reassign
        flights = flights.orderBy(field, order);
        break;
      }
      default:
        throw new Error(`Unknown op: ${op} ${args}`);
    }
  });

  return flights.value();
}
