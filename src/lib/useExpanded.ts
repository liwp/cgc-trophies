import { useState } from "react";

/** Where the expanded rows sit in a history entry's state. */
const KEY = "expanded";

/** The row keys expanded in a history entry's state. */
export const expandedKeys = (state: unknown): string[] => {
  const keys = (state as Record<string, unknown> | null)?.[KEY];
  return Array.isArray(keys)
    ? keys.filter((k): k is string => typeof k === "string")
    : [];
};

/**
 * A history entry's state with a row expanded or collapsed, keeping whatever
 * else is in it (such as how the flight pop-up was opened).
 */
export const withExpanded = (
  state: unknown,
  key: string,
  expanded: boolean,
): Record<string, unknown> => {
  const rest = state && typeof state === "object" ? state : {};
  const keys = expandedKeys(state).filter((k) => k !== key);
  return { ...rest, [KEY]: expanded ? [...keys, key] : keys };
};

/** The current history entry's own state, as React Router keeps it. */
export const entryState = (): unknown => window.history.state?.usr;

/**
 * Whether a row is expanded, and a toggle for it. Saved in the history entry
 * as well as the row, so Back and Forward bring back the rows the reader had
 * open (a reload keeps them too), while a fresh visit starts collapsed. The
 * row's own state shows a click at once; the entry is written directly, as
 * routing through React Router would re-render the page and lag a click
 * behind. `key` must be unique on the page, e.g. a table's name and the
 * row's id.
 */
export const useExpanded = (key: string): [boolean, () => void] => {
  // From the live entry, not React Router's copy, which misses the toggles
  // written behind its back: a row remounted (say while flights reload)
  // would come back collapsed.
  const [expanded, setExpanded] = useState(() =>
    expandedKeys(entryState()).includes(key),
  );
  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    const { state } = window.history;
    window.history.replaceState(
      { ...state, usr: withExpanded(state?.usr, key, next) },
      "",
    );
  };
  return [expanded, toggle];
};
