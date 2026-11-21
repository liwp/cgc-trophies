import { ChevronRight } from "lucide-react";

/**
 * The disclosure chevron that expands a row, at the row's start: it points
 * right when collapsed and turns down when expanded. A real button, so the row
 * can be expanded from the keyboard and screen readers hear its state; clicks
 * on the rest of the row can still toggle it too.
 */
const ExpandButton = ({
  expanded,
  onToggle,
  label,
  iconSize = 16,
  className = "",
}: {
  expanded: boolean;
  onToggle: () => void;
  /** What expanding reveals, e.g. "Flights for Jane Smith". */
  label: string;
  iconSize?: number;
  className?: string;
}) => (
  <button
    type="button"
    aria-expanded={expanded}
    aria-label={label}
    className={`inline-flex shrink-0 text-gray-400 ${className}`}
    onClick={(e) => {
      // Don't let the row's own click handler toggle it straight back.
      e.stopPropagation();
      onToggle();
    }}
  >
    <ChevronRight
      size={iconSize}
      aria-hidden
      className={`transition-transform ${expanded ? "rotate-90" : ""}`}
    />
  </button>
);

/** Holds a chevron's place in a row that has nothing to expand. */
export const ExpandSpacer = ({ iconSize = 16 }: { iconSize?: number }) => (
  <span
    aria-hidden
    className="inline-block shrink-0"
    style={{ width: iconSize }}
  />
);

export default ExpandButton;
