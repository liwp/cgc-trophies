const pct = (completed: number, total: number) =>
  total > 0 ? Math.round((100 * completed) / total) : 0;

export interface CompletionBar {
  label: string;
  completed: number;
  total: number;
}

/**
 * Attempted tasks per category as bars, the completed part in colour, each
 * labelled with its completion rate (the legend is the caller's). Each bar is focusable and shows its
 * counts on hover or focus; screen readers read them from the list.
 */
const CompletionChart = ({
  title,
  bars,
}: {
  title: string;
  bars: CompletionBar[];
}) => {
  const max = Math.max(...bars.map((b) => b.total));
  const height = (v: number) => (max > 0 ? `${(100 * v) / max}%` : 0);
  return (
    <figure className="min-w-0 rounded-xl border border-gray-200 bg-white px-4 pt-3 pb-2">
      <figcaption className="text-sm font-semibold text-gray-700">
        {title}
      </figcaption>
      <ul className="mt-8 flex h-36 items-end gap-2 border-b border-gray-300">
        {bars.map(({ label, completed, total }, i) => {
          const description = `${label}: ${completed} / ${total} completed${
            total > 0 ? ` (${pct(completed, total)}%)` : ""
          }`;
          const align =
            i === 0 ? "left-0" : i === bars.length - 1 ? "right-0" : "";
          return (
            <li
              key={label}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              <span
                aria-hidden
                className="mb-1 text-xs font-medium text-gray-700 tabular-nums"
              >
                {total > 0 ? `${pct(completed, total)}%` : ""}
              </span>
              <span
                // biome-ignore lint/a11y/noNoninteractiveTabindex: focus shows the bar's tooltip
                tabIndex={0}
                role="img"
                aria-label={description}
                className="flex w-full max-w-12 flex-col justify-end gap-0.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-cambridge"
                style={{ height: height(total) }}
              >
                {total > completed && (
                  <span
                    className="w-full rounded-t bg-gray-300"
                    style={{ flexGrow: total - completed }}
                  />
                )}
                {completed > 0 && (
                  <span
                    className={`w-full bg-cambridge-dark ${
                      total > completed ? "" : "rounded-t"
                    }`}
                    style={{ flexGrow: completed }}
                  />
                )}
              </span>
              <span
                aria-hidden
                className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap group-hover:block group-focus-within:block ${align}`}
              >
                {description}
              </span>
            </li>
          );
        })}
      </ul>
      <ol aria-hidden className="mt-1 flex gap-2">
        {bars.map(({ label, completed, total }) => (
          <li
            key={label}
            className="min-w-0 flex-1 whitespace-nowrap text-center text-[10px] leading-tight sm:text-xs"
          >
            <div className="text-gray-700">{label}</div>
            <div className="text-gray-400 tabular-nums">
              {/* Narrow no-break spaces, to fit six bands on a phone */}
              {`${completed}\u202f/\u202f${total}`}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
};

export default CompletionChart;
