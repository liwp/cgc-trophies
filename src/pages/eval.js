import { chain, get, isEqual, isFunction, reverse } from "lodash";

const comparators = {
  "=": (x, y) => x === y,
  "<=": (x, y) => x <= y,
  "<=>": (xs, ys) => isEqual(xs, ys) || isEqual(xs, reverse(ys)),
};

export function trophyEval(flights, expr) {
  // eslint-disable-next-line no-param-reassign
  flights = chain(flights);
  expr.forEach(([op, ...args]) => {
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
