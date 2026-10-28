import { type ReactNode, useId, useState } from "react";

/**
 * Inline text with a tooltip shown on hover (on devices that can hover), on
 * keyboard focus, and toggled by a click or tap.
 */
const Tip = ({
  tip,
  children,
  className = "",
}: {
  tip: string;
  children: ReactNode;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={tip}
        aria-describedby={id}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className={`cursor-help ${className}`}
      >
        {children}
      </button>
      <span
        id={id}
        role="tooltip"
        className={`${
          open ? "block" : "hidden"
        } group-hover:block group-has-focus-visible:block absolute left-0 top-full z-10 mt-1 w-max max-w-64 whitespace-normal rounded font-sans bg-gray-900 px-2 py-1 text-xs font-normal text-white shadow`}
      >
        {tip}
      </span>
    </span>
  );
};

export default Tip;
