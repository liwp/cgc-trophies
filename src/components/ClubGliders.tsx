import type { ClubGliderStats } from "../lib/stats";
import Th from "./Th";

const whole = (v: number) => Math.round(v).toLocaleString("en-GB");

const cell =
  "px-4 py-2 text-right tabular-nums whitespace-nowrap text-gray-700";

/** How much each of the club's own gliders was flown cross-country. */
const ClubGliders = ({ stats }: { stats: ClubGliderStats[] }) => (
  <section aria-labelledby="club-gliders" className="flex flex-col gap-2">
    <h2 id="club-gliders" className="text-lg font-semibold text-gray-900">
      Club gliders
    </h2>
    <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <Th>Glider</Th>
            <Th align="right">Flights</Th>
            <Th align="right">Km</Th>
            <Th align="right">Points</Th>
            <Th align="right">Pilots</Th>
          </tr>
        </thead>
        <tbody>
          {stats.map(({ glider, flights, scoringKm, points, pilots }) => (
            <tr key={glider.registration} className="border-b border-gray-100">
              <td className="px-4 py-2 whitespace-nowrap">
                <span className="font-medium text-gray-900">
                  {glider.name} {glider.compNo}
                </span>{" "}
                <span className="text-xs text-gray-500">
                  {glider.registration}
                </span>
              </td>
              <td className={cell}>{flights}</td>
              <td className={cell}>{whole(scoringKm)}</td>
              <td className={cell}>{whole(points)}</td>
              <td className={cell}>{pilots}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default ClubGliders;
