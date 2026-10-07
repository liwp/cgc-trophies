import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * The chevron that expands a results row. A real button, so the row can be
 * expanded from the keyboard and screen readers hear its state; clicks on the
 * rest of the row can still toggle it too.
 */
const ExpandButton = ({
  expanded,
  onToggle,
  label,
  iconSize = 16,
}: {
  expanded: boolean;
  onToggle: () => void;
  /** What expanding reveals, e.g. "Flights for Jane Smith". */
  label: string;
  iconSize?: number;
}) => (
  <button
    type="button"
    aria-expanded={expanded}
    aria-label={label}
    className="text-gray-400"
    onClick={(e) => {
      // Don't let the row's own click handler toggle it straight back.
      e.stopPropagation();
      onToggle();
    }}
  >
    {expanded ? <ChevronUp size={iconSize} /> : <ChevronDown size={iconSize} />}
  </button>
);

export default ExpandButton;
