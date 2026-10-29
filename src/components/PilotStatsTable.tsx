import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type PilotColumn,
  type PilotStats,
  pilotColumns,
  pilotStatsCopyData,
} from "../lib/stats";
import CopyButton from "./CopyButton";
import Toggle from "./Toggle";

type Sort = { key: string; desc: boolean };

const TOP = 10;

const tableColumns = pilotColumns.filter((c) => !c.copyOnly);

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
      className={`px-3 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap ${
        left ? "text-left" : "text-right"
      } ${column.key === "pilot" ? "sticky left-0 bg-gray-50" : ""}`}
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
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Pilots</h2>
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
          <table className="w-full table-auto border-collapse text-sm">
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
              </tr>
            </thead>
            <tbody>
              {(topOnly ? sorted.slice(0, TOP) : sorted).map((s) => (
                <tr key={s.pilot} className="border-b border-gray-100">
                  {tableColumns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-3 py-2 ${
                        column.key === "pilot"
                          ? "sticky left-0 bg-white whitespace-nowrap font-medium text-gray-900"
                          : "whitespace-nowrap text-right tabular-nums text-gray-700"
                      }`}
                    >
                      {column.format(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default PilotStatsTable;
