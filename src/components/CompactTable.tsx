import type { ReactNode } from "react";

/**
 * Pieces for the stats tables that fit a phone: fixed-layout tables whose
 * cells have tighter padding on a phone.
 */

/** A cell's padding: tighter on a phone, so the table fits without scrolling. */
export const pad = "px-1.5 py-2 sm:px-4";

/** A header cell with a fixed width, as a fixed-layout table needs. */
export const Th = ({
  children,
  width,
  right = false,
  className = "",
}: {
  children?: ReactNode;
  /** Tailwind width classes; empty for the column that takes the rest. */
  width: string;
  right?: boolean;
  className?: string;
}) => (
  <th
    className={`${pad} sm:py-3 ${width} ${className} ${
      right ? "text-right" : "text-left"
    } text-sm font-semibold text-gray-700`}
  >
    {children}
  </th>
);

/** The header of the narrow expand-button column, named for screen readers. */
export const ExpandTh = ({ width }: { width: string }) => (
  // Relative, so the hidden label can't escape the scrolling card.
  <th className={`relative ${width}`}>
    <span className="sr-only">Expand</span>
  </th>
);

/** A date, as the stats tables show it, in UTC like the ladder's dates. */
export const dateText = (d: Date, options: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });

/** A short date: "28 Jul" on a phone, "Sun 28 Jul" where there's room. */
export const ShortDate = ({ date }: { date: Date }) => (
  <>
    <span className="hidden sm:inline">
      {dateText(date, { weekday: "short" })}{" "}
    </span>
    {dateText(date, { day: "numeric", month: "short" })}
  </>
);
