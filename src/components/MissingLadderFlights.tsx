import { formatDate } from "../lib/formatDate";
import type { MissingLadderFlights as Missing } from "../lib/missingLadderFlights";
import { formatScore } from "../lib/results";
import { formatPilotName } from "../lib/trophyCopyData";
import FlightLinks from "./FlightLinks";
import Th from "./Th";

const pts = (value: number) => formatScore({ value, unit: "pts" });

/** A pilot's Open Ladder flights that aren't on the club ladder. */
const MissingFlights = ({
  missing,
  clubName,
}: {
  missing: Missing;
  clubName: string;
}) => (
  <ul className="flex flex-col gap-1">
    {missing.flights.map((f) => (
      <li key={f.id} className="flex items-center gap-2">
        <span>
          {formatDate(f.date)} · {pts(f.task.crossCountryPoints)}
          {f.clubName !== clubName && ` · filed under ${f.clubName}`}
        </span>
        <FlightLinks flightId={f.id} iconSize={14} inline />
      </li>
    ))}
  </ul>
);

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
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="hidden w-full table-auto border-collapse text-sm sm:table">
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
                  <MissingFlights missing={m} clubName={clubName} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="sm:hidden">
          {missing.map((m) => (
            <li
              key={m.pilot}
              className="flex flex-col gap-1 border-t border-gray-100 px-3 py-2.5 text-sm first:border-t-0"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-gray-900">
                  {formatPilotName(m.pilot)}
                </span>
                <span className="whitespace-nowrap text-gray-500">
                  {pts(m.currentScore)} →{" "}
                  <span className="text-gray-700">{pts(m.potentialScore)}</span>
                </span>
              </div>
              <div className="text-xs text-gray-500">
                <MissingFlights missing={m} clubName={clubName} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MissingLadderFlights;
