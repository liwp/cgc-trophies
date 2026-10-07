import { uniqBy } from "lodash";
import { useState } from "react";
import { formatScore } from "../lib/results";
import { flightCopyData, formatPilotName } from "../lib/trophyCopyData";
import TURNPOINTS from "../lib/turnpoints";
import type { ScoredFlight } from "../types";
import CopyButton from "./CopyButton";
import FlightLinks from "./FlightLinks";
import HeightLossWarning from "./HeightLossWarning";
import Th from "./Th";
import Toggle from "./Toggle";
import Tooltip from "./Tooltip";

const Score = ({ value, unit }: { value: number; unit: string }) => (
  <span>{formatScore({ value, unit })}</span>
);

const Task = ({
  task,
}: {
  task: { start: string; turnpoints: string[]; finish: string };
}) => {
  const tps = [task.start, ...task.turnpoints, task.finish];
  const fullNames = tps
    .map((tp) => TURNPOINTS[tp]?.name || tp)
    .join(" \u2013 ");

  return (
    <Tooltip text={fullNames}>
      <span>{tps.join(" \u2013 ")}</span>
    </Tooltip>
  );
};

const Result = ({ result, rank }: { result: ScoredFlight; rank: number }) => {
  const {
    date,
    id,
    pilot,
    score: { unit, value },
    task,
  } = result;

  return (
    <tr className={rank === 1 ? "bg-cambridge-light" : ""}>
      <td className="px-4 py-3 text-gray-700">{formatPilotName(pilot)}</td>
      <td className="px-4 py-3 text-gray-500">{date.toLocaleDateString()}</td>
      <td className="px-4 py-3 text-gray-700">
        <Score value={value} unit={unit} />
      </td>
      <td className="px-4 py-3 text-gray-500">
        <Task task={task} />
      </td>
      <td className="px-4 py-3">
        <div className="inline-flex items-center gap-1">
          <FlightLinks flightId={id} />
          {rank === 1 && <CopyButton data={flightCopyData(result)} />}
          {rank === 1 && (
            <HeightLossWarning
              flightId={id}
              reportedHeightLoss={task.heightLoss}
            />
          )}
        </div>
      </td>
    </tr>
  );
};

const ResultsList = ({ results }: { results: ScoredFlight[] }) => {
  const [unique, setUnique] = useState(true);

  const filtered = unique ? uniqBy(results, "pilot") : results;

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 italic">
        No qualifying flights
      </div>
    );
  }

  return (
    <div>
      <div className="px-3 py-3">
        <Toggle
          id="unique"
          checked={unique}
          label="One flight per pilot?"
          onChange={() => setUnique(!unique)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <Th>Pilot</Th>
              <Th>Date</Th>
              <Th>Score</Th>
              <Th>Task</Th>
              <Th>Links</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((result, i) => (
              <Result key={result.id} result={result} rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsList;
