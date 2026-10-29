import { formatDate } from "../lib/formatDate";
import type { MissingLadderFlights as Missing } from "../lib/missingLadderFlights";
import { formatScore } from "../lib/results";
import { formatPilotName } from "../lib/trophyCopyData";
import FlightLinks from "./FlightLinks";
import Th from "./Th";

const pts = (value: number) => formatScore({ value, unit: "pts" });

/** Eligible pilots whose Open Ladder flights aren't on a club ladder. */
const MissingLadderFlights = ({
  missing,
  ladderName,
  clubName,
}: {
  missing: Missing[];
  ladderName: string;
  clubName: string;
}) => {
  if (missing.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold text-gray-900">
        Open Ladder flights missing from the {ladderName} ladder
      </h4>
      <p className="text-sm text-gray-400">
        Pilots eligible for this trophy whose Open Ladder flights aren't on its
        ladder. Remind them to add the flights before the awards.
      </p>
      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <Th compact>Pilot</Th>
              <Th compact>Entered</Th>
              <Th compact>If added</Th>
              <Th compact>Missing flights</Th>
            </tr>
          </thead>
          <tbody>
            {missing.map((m) => (
              <tr key={m.pilot} className="border-b border-gray-100 align-top">
                <td className="px-4 py-2 text-gray-700">
                  {formatPilotName(m.pilot)}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {pts(m.currentScore)}
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {pts(m.potentialScore)}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  <ul className="flex flex-col gap-1">
                    {m.flights.map((f) => (
                      <li key={f.id} className="flex items-center gap-2">
                        <span>
                          {formatDate(f.date)} ·{" "}
                          {pts(f.task.crossCountryPoints)}
                          {f.clubName !== clubName &&
                            ` · filed under ${f.clubName}`}
                        </span>
                        <FlightLinks flightId={f.id} iconSize={14} inline />
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MissingLadderFlights;
