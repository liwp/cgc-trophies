import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from "react";

const alignClass = {
  center: "left-1/2 -translate-x-1/2",
  left: "left-0",
  right: "right-0",
};

type AriaProps = {
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
};

/**
 * Shows `text` on hover and when the wrapped element has keyboard focus. The
 * text is linked to the wrapped element for assistive technology: as its
 * description by default, or as its accessible name with `asLabel` (for
 * icon-only controls whose only label is the tooltip).
 */
const Tooltip = ({
  text,
  side = "top",
  align = "center",
  asLabel = false,
  children,
}: {
  text: string;
  side?: "top" | "bottom";
  align?: "center" | "left" | "right";
  asLabel?: boolean;
  children: ReactNode;
}) => {
  const id = useId();
  const linked = isValidElement(children)
    ? cloneElement(
        children as ReactElement<AriaProps>,
        asLabel ? { "aria-labelledby": id } : { "aria-describedby": id },
      )
    : children;

  return (
    <span className="relative group/tooltip inline-flex">
      {linked}
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute z-50
          rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap
          opacity-0 transition-opacity delay-150
          group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100
          ${side === "top" ? "bottom-full mb-1" : "top-full mt-1"}
          ${alignClass[align]}`}
      >
        {text}
      </span>
    </span>
  );
};

export default Tooltip;
