import { useState } from "react";
import type { TopTask } from "../lib/stats";
import type { Flight } from "../types";
import { ExpandTh, pad, ShortDate, Th } from "./CompactTable";
import ExpandButton from "./ExpandButton";
import { FlightSpeed, kph, PilotLink } from "./FlightRow";
import Route from "./Route";

const sub = "text-xs text-gray-400";

/**
 * One of a task's flights, under its row: the date and pilot (and, where
 * there's room, the glider) under the task, and the speed across the
 * completion and speed columns, which leaves room for "Not completed".
 */
const TaskFlightRow = ({ flight }: { flight: Flight }) => (
  <tr className="bg-gray-50 text-gray-500">
    <td className="py-1.5 pr-1.5 pl-4 sm:pr-4 sm:pl-10">
      {/* Stacked on a phone, in a line where there's room. */}
      <div className="flex flex-col sm:grid sm:grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-x-4">
        <span className={`${sub} sm:text-sm sm:text-gray-500 tabular-nums`}>
          <ShortDate date={flight.date} />
        </span>
        <span className="truncate">
          <PilotLink flight={flight} />
        </span>
        <span className="hidden truncate text-gray-400 sm:inline">
          {flight.glider.type}
        </span>
      </div>
    </td>
    <td
      colSpan={2}
      className="px-1.5 py-1.5 text-right tabular-nums whitespace-nowrap align-bottom sm:px-4 sm:align-middle"
    >
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
