const { drop, dropRight, zipWith } = require("lodash");
const wgs84util = require("wgs84-util");

function tpDistance(tp1, tp2) {
  return (
    wgs84util.distanceBetween(
      {
        type: "Point",
        coordinates: [tp1.lon, tp1.lat],
      },
      {
        type: "Point",
        coordinates: [tp2.lon, tp2.lat],
      }
    ) / 1000
  );
}

const categories = [
  {
    key: "open",
    // TODO: should we check the flight?
    pred: () => true,
  },
  {
    key: "weekend",
    // TODO: I think it's flight.ladders.weekendLadder...
    pred: (flight) => flight.weekendLadder,
  },
  {
    key: "300km",
    pred: ({ task: { scoringDistanceKm } }) =>
      300 <= scoringDistanceKm && scoringDistanceKm < 400,
  },
  {
    key: "400km",
    pred: ({ task: { scoringDistanceKm } }) =>
      400 <= scoringDistanceKm && scoringDistanceKm < 500,
  },
  {
    key: "500km",
    pred: ({ task: { scoringDistanceKm } }) =>
      500 <= scoringDistanceKm && scoringDistanceKm < 750,
  },
  {
    key: "750km",
    pred: ({ task: { scoringDistanceKm } }) => 750 <= scoringDistanceKm,
  },
];

function updateCategory(stats, flight) {
  const { isCompleted = false, isDeclared = false } = flight.task || {};
  let { completed, total } = stats || { total: 0, completed: 0, percentage: 0 };

  if (isCompleted && isDeclared) {
    completed += 1;
  }
  total += 1;

  return Object.assign({}, stats, {
    completed,
    total,
    percentage: (100 * completed) / total,
  });
}

function updateAttemptedDistance(stats, { task: { tps, scoringDistanceKm } }) {
  let { attemptedKm } = stats;

  if (!tps || tps.some(({ id }) => id[0] === "*")) {
    // If there are any user-defined TPs (ie starts with *) use the scoring
    // distance as the attempted distance.
    // TODO: we could work out the projection to the last leg for the
    // abandonment point
    attemptedKm += scoringDistanceKm;
  } else {
    attemptedKm += zipWith(dropRight(tps, 1), drop(tps, 1), tpDistance).reduce(
      (sum, x) => sum + x,
      0
    );
  }

  return {
    ...stats,
    attemptedKm,
  };
}

function updateStats(prevStats, flight) {
  if (flight.task.claimType !== "C") {
    return prevStats;
  }

  const nextStats = Object.assign({}, prevStats);
  categories
    .filter(({ pred }) => pred(flight))
    .forEach(({ key }) => {
      nextStats[key] = updateCategory(nextStats[key], flight);
    });

  return nextStats;
}

function calculateStats(flights) {
  return flights.reduce(updateStats, {});
}

module.exports = {
  calculateStats,
  categories,
  updateAttemptedDistance,
  updateCategory,
  updateStats,
};
