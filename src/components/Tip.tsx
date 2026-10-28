import { type ReactNode, useId, useRef, useState } from "react";

/** Space kept between a tooltip and the viewport's right edge, in px. */
const EDGE = 8;

/**
 * Inline text with a tooltip shown on hover (on devices that can hover), on
 * keyboard focus, and toggled by a click or tap. The visible text stays the
 * button's name; the tooltip is its description.
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
  const [shift, setShift] = useState(0);
  const tipRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  // Once the tooltip is showing, pull it left if it would pass the
  // viewport's right edge.
  const place = () =>
    requestAnimationFrame(() => {
      const el = tipRef.current;
      if (!el) return;
      // The rect already includes the current shift; undo it to get the natural edge.
      const right = el.getBoundingClientRect().right + shift;
      setShift(
        Math.max(0, right - (document.documentElement.clientWidth - EDGE)),
      );
    });

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-describedby={id}
        onClick={() => {
          setOpen((o) => !o);
          place();
        }}
        onFocus={place}
        onMouseEnter={place}
        onBlur={() => setOpen(false)}
        className={`cursor-help ${className}`}
      >
        {children}
      </button>
      <span
        id={id}
        ref={tipRef}
        role="tooltip"
        style={{ left: -shift }}
        className={`${
          open ? "block" : "hidden"
        } group-hover:block group-has-focus-visible:block absolute top-full z-10 mt-1 w-max max-w-64 whitespace-normal rounded font-sans bg-gray-900 px-2 py-1 text-xs font-normal text-white shadow`}
      >
        {tip}
      </span>
    </span>
  );
};

export default Tip;
