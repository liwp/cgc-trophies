import { Fragment, useState } from "react";
import type { TopTask } from "../lib/stats";
import TURNPOINTS from "../lib/turnpoints";
import type { Flight } from "../types";
import ExpandButton from "./ExpandButton";
import FlightRow, { FlightSpeed, kph } from "./FlightRow";
import Th from "./Th";
import Tip from "./Tip";

const routeNames = (route: string[]) =>
  route.map((code) => TURNPOINTS[code]?.name ?? code).join(" – ");

const completedOf = (completed: number, total: number) =>
  `${completed} / ${total}`;

const TaskFlightRow = ({ flight }: { flight: Flight }) => (
  <FlightRow flight={flight} span={3} detail={flight.glider.type}>
    <td className="px-4 py-1.5 text-right tabular-nums whitespace-nowrap">
      <FlightSpeed flight={flight} />
    </td>
    <td />
  </FlightRow>
);

const TaskRow = ({ task }: { task: TopTask }) => {
  const [expanded, setExpanded] = useState(false);
  const { route, taskDistanceKm, completed, total, avgSpeedKph, flights } =
    task;
  const toggle = () => setExpanded(!expanded);
  return (
    <>
      <tr
        className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors"
        onClick={toggle}
      >
        <td className="px-4 py-2 whitespace-nowrap">
          <Tip tip={routeNames(route)} className="font-mono text-gray-900">
            {route.join(" – ")}
          </Tip>
        </td>
        <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap text-gray-700">
          {Math.round(taskDistanceKm)} km
        </td>
        <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap text-gray-700">
          {completedOf(completed, total)}{" "}
          <span className="text-gray-400">
            ({Math.round((100 * completed) / total)}%)
          </span>
        </td>
        <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap text-gray-700">
          {kph(avgSpeedKph)}
        </td>
        <td className="py-2 pr-4">
          <ExpandButton
            expanded={expanded}
            onToggle={toggle}
            label={`Flights of ${route.join("-")}`}
          />
        </td>
      </tr>
      {expanded &&
        flights.map((flight) => (
          <TaskFlightRow key={flight.id} flight={flight} />
        ))}
    </>
  );
};

/** The season's most flown tasks, either way round; a row expands to its flights. */
const TopTasks = ({ tasks }: { tasks: TopTask[] }) => (
  <section aria-labelledby="top-tasks" className="flex flex-col gap-2">
    <h2 id="top-tasks" className="text-lg font-semibold text-gray-900">
      Top tasks
    </h2>
    <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
      {tasks.length === 0 ? (
        <p className="px-4 py-3 text-gray-400 italic">No tasks</p>
      ) : (
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <Th>Task</Th>
              <Th align="right">Distance</Th>
              <Th align="right">Completed / attempts</Th>
              <Th align="right">Avg speed</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <Fragment key={task.route.join("-")}>
                <TaskRow task={task} />
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </section>
);

export default TopTasks;
