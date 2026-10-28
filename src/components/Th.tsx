import type { ReactNode } from "react";

/** A results-table header cell. `compact` is for the denser admin tables. */
const Th = ({
  children,
  align = "left",
  compact = false,
  width = "",
}: {
  children?: ReactNode;
  align?: "left" | "right";
  compact?: boolean;
  /** A Tailwind width class, for fixed-layout tables */
  width?: string;
}) => (
  <th
    className={`px-4 ${compact ? "py-2" : "py-3"} ${
      align === "right" ? "text-right" : "text-left"
    } text-sm font-semibold text-gray-700 ${width}`}
  >
    {children}
  </th>
);

export default Th;
