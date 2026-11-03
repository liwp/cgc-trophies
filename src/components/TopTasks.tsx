import { useState } from "react";
import type { TopTask } from "../lib/stats";
import type { Flight } from "../types";
import { ExpandTh, pad, Th } from "./CompactTable";
import ExpandButton from "./ExpandButton";
import { FlightSpeed, FlightSummary, flightCell, kph } from "./FlightRow";
import Route from "./Route";

const sub = "text-xs text-gray-400";

/**
 * One of a task's flights, under its row: its date, pilot and glider under
 * the task, and the speed across the
 * completion and speed columns, which leaves room for "Not completed".
 */
const TaskFlightRow = ({ flight }: { flight: Flight }) => (
  <tr className="bg-gray-50 text-gray-500">
    <FlightSummary flight={flight} detail={flight.glider.type} />
    <td colSpan={2} className={flightCell}>
      <FlightSpeed flight={flight} />
    </td>
    <td />
  </tr>
);

const TaskRow = ({ task }: { task: TopTask }) => {
  const [expanded, setExpanded] = useState(false);
  const { route, taskDistanceKm, completed, total, avgSpeedKph, flights } =
    task;
  const toggle = () => setExpanded(!expanded);
  return (
    <>
      <tr
        className="cursor-pointer border-b border-gray-100 align-top hover:bg-gray-50 transition-colors"
        onClick={toggle}
      >
        <td className={pad}>
          {/* Long routes wrap on a phone rather than widen the table. */}
          <Route route={route} className="text-left text-gray-900" />
          <div className={`${sub} tabular-nums`}>
            {Math.round(taskDistanceKm)} km
          </div>
        </td>
        <td className={`${pad} text-right tabular-nums whitespace-nowrap`}>
          <div className="text-gray-700">
            {completed} / {total}
          </div>
          <div className={sub}>{Math.round((100 * completed) / total)}%</div>
        </td>
        <td
          className={`${pad} text-right tabular-nums whitespace-nowrap text-gray-700`}
        >
          {kph(avgSpeedKph)}
        </td>
        <td className="py-2 pr-1.5 sm:pr-4">
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
        // Fixed widths, so expanding a task can't move the columns; the task
        // column takes the rest. It fits a phone; the card still scrolls if a
        // screen is too narrow even for that.
        <table className="w-full min-w-72 table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <Th width="">Task</Th>
              <Th right width="w-[5.25rem] sm:w-32">
                Completed
              </Th>
              <Th right width="w-20 sm:w-28">
                Avg speed
              </Th>
              <ExpandTh width="w-7 sm:w-12" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskRow key={task.route.join("-")} task={task} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  </section>
);

export default TopTasks;
