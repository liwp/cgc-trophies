import type { MonthActivity } from "../lib/stats";

const monthName = (m: MonthActivity, month: "short" | "long") =>
  new Date(Date.UTC(m.year, m.month - 1, 1)).toLocaleDateString("en-GB", {
    month,
    year: month === "long" ? "numeric" : undefined,
    timeZone: "UTC",
  });

const barHeight = (v: number, max: number) =>
  max > 0 ? `${(100 * v) / max}%` : 0;

/**
 * One measure per month as bars, beside last season's in grey, with the
 * season's busiest month labelled. Each month is focusable and shows both
 * values on hover or focus; screen readers read them from the list.
 */
const MonthlyChart = ({
  title,
  season,
  months,
  previous,
  value,
  format,
}: {
  title: string;
  season: number;
  months: MonthActivity[];
  /** Last season's months, in the same order. */
  previous: MonthActivity[];
  value: (m: MonthActivity) => number;
  format: (v: number) => string;
}) => {
  const max = Math.max(...months.map(value), ...previous.map(value));
  const seasonMax = Math.max(...months.map(value));
  const peak = months.findIndex((m) => seasonMax > 0 && value(m) === seasonMax);
  return (
    <figure className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-4 pt-3 pb-2">
      <figcaption className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <div aria-hidden className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-cambridge-dark" />
            {season}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-gray-300" />
            {season - 1}
          </span>
        </div>
      </figcaption>
      <ul className="mt-6 flex h-32 items-end gap-0.5 border-b border-gray-300">
        {months.map((m, i) => {
          const v = value(m);
          const prev = previous[i];
          const lines = [`${monthName(m, "long")}: ${format(v)}`];
          if (prev) {
            lines.push(`${monthName(prev, "long")}: ${format(value(prev))}`);
          }
          const label = lines.join(", ");
          // Keep the tooltip inside the chart at either end
          const align = i < months.length / 2 ? "left-0" : "right-0";
          return (
            <li
              key={`${m.year}-${m.month}`}
              className="group relative flex h-full flex-1 items-end justify-center"
            >
              {/* A hit target the full height of the plot, wider than the bars */}
              <span
                // biome-ignore lint/a11y/noNoninteractiveTabindex: focus shows the month's tooltip
                tabIndex={0}
                role="img"
                aria-label={label}
                className="flex h-full w-full items-end justify-center gap-0.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-cambridge"
              >
                <span
                  className="w-full max-w-3 rounded-t bg-cambridge-dark transition-colors group-hover:bg-cambridge group-focus-within:bg-cambridge"
                  style={{ height: barHeight(v, max) }}
                />
                {prev && (
                  <span
                    className="w-full max-w-3 rounded-t bg-gray-300"
                    style={{ height: barHeight(value(prev), max) }}
                  />
                )}
              </span>
              {i === peak && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute mb-1 text-xs font-medium text-gray-700 tabular-nums whitespace-nowrap"
                  style={{ bottom: barHeight(v, max) }}
                >
                  {format(v)}
                </span>
              )}
              <span
                aria-hidden
                className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap group-hover:block group-focus-within:block ${align}`}
              >
                {lines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      <ol aria-hidden className="mt-1 flex gap-0.5">
        {months.map((m) => (
          <li
            key={`${m.year}-${m.month}`}
            className="flex-1 text-center text-[10px] text-gray-500"
          >
            {monthName(m, "short")}
          </li>
        ))}
      </ol>
    </figure>
  );
};

export default MonthlyChart;
