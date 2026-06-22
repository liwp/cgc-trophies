import { calculateStats } from "../lib/stats";
import type { Flight } from "../types";

const FlightCategory = ({
  completed,
  label,
  total,
}: {
  completed?: number;
  label: string;
  total?: number;
}) => {
  return (
    <div className="text-center">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900 mt-1">
        {completed || 0}
      </div>
      <div className="text-xs text-gray-400">{total || 0} attempts</div>
    </div>
  );
};

const Stats = ({ flights, season }: { flights: Flight[]; season: number }) => {
  const start = new Date(`${season}-01-01`);
  const end = new Date(`${season}-12-31`);
  const flightsInYear = flights.filter(
    ({ date }) => start <= date && date <= end,
  );
  const stats = calculateStats(flightsInYear);

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
      <div className="flex justify-around">
        <FlightCategory label="All Flights" {...stats.open} />
        <FlightCategory label="300 km" {...stats["300km"]} />
        <FlightCategory label="400 km" {...stats["400km"]} />
        <FlightCategory label="500 km" {...stats["500km"]} />
        <FlightCategory label="750 km" {...stats["750km"]} />
      </div>
    </div>
  );
};

export default Stats;
