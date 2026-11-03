import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type PilotColumn,
  type PilotStats,
  pilotColumns,
  pilotStatsCopyData,
} from "../lib/stats";
import { shortPilotName } from "../lib/trophyCopyData";
import { ExpandTh } from "./CompactTable";
import CopyButton from "./CopyButton";
import ExpandButton from "./ExpandButton";
import Toggle from "./Toggle";

type Sort = { key: string; desc: boolean };

const TOP = 10;

const tableColumns = pilotColumns.filter((c) => !c.copyOnly);

/** The columns a phone has room for; a pilot expands to the rest. */
const PHONE = new Set(["pilot", "flights", "scoringKm", "points"]);
const moreColumns = tableColumns.filter((c) => !PHONE.has(c.key));

/** Hidden on a phone, unless it's one of the phone's columns. */
const phoneOnly = (key: string) =>
  PHONE.has(key) ? "" : "hidden sm:table-cell";

/** Fixed widths on a phone, so expanding a pilot can't move the columns. */
const PHONE_WIDTH: Record<string, string> = {
  flights: "w-[3.75rem] sm:w-auto",
  scoringKm: "w-[3.25rem] sm:w-auto",
  points: "w-[4.5rem] sm:w-auto",
};

/** Sort on a column's value; nulls stay last whichever way it's sorted. */
function sortStats(stats: PilotStats[], column: PilotColumn, desc: boolean) {
  return [...stats].sort((a, b) => {
    const [x, y] = [column.value(a), column.value(b)];
    if (x === null || y === null)
      return (x === null ? 1 : 0) - (y === null ? 1 : 0);
    const order =
      typeof x === "string" ? x.localeCompare(String(y)) : x - (y as number);
    return desc ? -order : order;
  });
}

const SortHeader = ({
  column,
  sort,
  onSort,
}: {
  column: PilotColumn;
  sort: Sort;
  onSort: (key: string) => void;
}) => {
  const active = sort.key === column.key;
  const Arrow = sort.desc ? ArrowDown : ArrowUp;
  const left = column.key === "pilot";
  return (
    <th
      aria-sort={active ? (sort.desc ? "descending" : "ascending") : undefined}
      className={`px-1.5 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap sm:px-3 ${
        left ? "text-left" : "text-right"
      } ${column.key === "pilot" ? "sticky left-0 bg-gray-50" : ""} ${phoneOnly(
        column.key,
      )} ${PHONE_WIDTH[column.key] ?? ""}`}
    >
      <button
        type="button"
        title={column.title}
        onClick={() => onSort(column.key)}
        className={`inline-flex items-center gap-1 hover:text-cambridge ${
          active ? "text-cambridge" : ""
        }`}
      >
        {column.label}
        {active && <Arrow size={14} aria-hidden />}
      </button>
    </th>
  );
};

const cell = (key: string) =>
  `px-1.5 py-2 sm:px-3 ${phoneOnly(key)} ${
    key === "pilot"
      ? "sticky left-0 truncate bg-white font-medium text-gray-900"
      : "whitespace-nowrap text-right tabular-nums text-gray-700"
  }`;

/**
 * A pilot's row. A phone shows the main stats and expands to the rest as
 * labelled values, in a row of their own; wider screens show every column.
 */
const PilotRow = ({ stats }: { stats: PilotStats }) => {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded(!expanded);
  return (
    <>
      <tr
        className="border-b border-gray-100 max-sm:cursor-pointer"
        onClick={toggle}
      >
        {tableColumns.map((column) => (
          <td key={column.key} className={cell(column.key)}>
            {column.key === "pilot" ? (
              <>
                <span className="sm:hidden">{shortPilotName(stats.pilot)}</span>
                <span className="hidden sm:inline">{column.format(stats)}</span>
              </>
            ) : (
              column.format(stats)
            )}
          </td>
        ))}
        <td className="py-2 pr-1.5 sm:hidden">
          <ExpandButton
            expanded={expanded}
            onToggle={toggle}
            label={`More stats for ${tableColumns[0].format(stats)}`}
          />
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50 sm:hidden">
          <td colSpan={PHONE.size + 1} className="px-4 py-2">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {moreColumns.map((column) => (
                <div key={column.key} className="flex justify-between gap-2">
                  <dt className="text-gray-500" title={column.title}>
                    {column.label}
                  </dt>
                  <dd className="tabular-nums text-gray-700">
                    {column.format(stats) || "–"}
                  </dd>
                </div>
              ))}
            </dl>
          </td>
        </tr>
      )}
    </>
  );
};

/**
 * Each pilot's season, sortable by any column, by default only the top ten of
 * the current sort, with a spreadsheet copy of every pilot.
 */
const PilotStatsTable = ({ stats }: { stats: PilotStats[] }) => {
  const [sort, setSort] = useState<Sort>({ key: "points", desc: true });
  const [topOnly, setTopOnly] = useState(true);

  const sorted = useMemo(() => {
    const column = tableColumns.find((c) => c.key === sort.key);
    return column ? sortStats(stats, column, sort.desc) : stats;
  }, [stats, sort]);

  // A new column starts with names A-Z and numbers biggest first.
  const onSort = (key: string) =>
    setSort((prev) =>
      prev.key === key
        ? { key, desc: !prev.desc }
        : { key, desc: key !== "pilot" },
    );

  return (
    <section aria-labelledby="pilots" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 id="pilots" className="text-lg font-semibold text-gray-900">
          Pilots
        </h2>
        <div className="flex items-center gap-4">
          <Toggle
            id="top-pilots"
            label={`Top ${TOP} only`}
            checked={topOnly}
            onChange={() => setTopOnly(!topOnly)}
          />
          {/* Copies every pilot, whatever the table shows */}
          <CopyButton data={pilotStatsCopyData(sorted)} />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        {stats.length === 0 ? (
          <p className="px-4 py-3 text-gray-400 italic">No flights</p>
        ) : (
          <table className="w-full table-fixed border-collapse text-sm sm:table-auto">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {tableColumns.map((column) => (
                  <SortHeader
                    key={column.key}
                    column={column}
                    sort={sort}
                    onSort={onSort}
                  />
                ))}
                <ExpandTh width="w-7 sm:hidden" />
              </tr>
            </thead>
            <tbody>
              {(topOnly ? sorted.slice(0, TOP) : sorted).map((s) => (
                <PilotRow key={s.pilot} stats={s} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default PilotStatsTable;
