import type { ReactNode } from "react";

const alignClass = {
  center: "left-1/2 -translate-x-1/2",
  left: "left-0",
  right: "right-0",
};

const Tooltip = ({
  text,
  side = "top",
  align = "center",
  children,
}: {
  text: string;
  side?: "top" | "bottom";
  align?: "center" | "left" | "right";
  children: ReactNode;
}) => (
  <span className="relative group/tooltip inline-flex">
    {children}
    <span
      role="tooltip"
      className={`pointer-events-none absolute z-50
        rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap
        opacity-0 transition-opacity delay-150 group-hover/tooltip:opacity-100
        ${side === "top" ? "bottom-full mb-1" : "top-full mt-1"}
        ${alignClass[align]}`}
    >
      {text}
    </span>
  </span>
);

export default Tooltip;
