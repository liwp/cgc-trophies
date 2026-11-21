import { type ReactNode, useEffect, useId, useRef, useState } from "react";

/** Space kept between a tooltip and the viewport's right edge, in px. */
const EDGE = 8;

/** Closes the open tooltip, so that opening another closes it. */
let closeOpenTip: (() => void) | null = null;

/**
 * Inline text with a tooltip shown on hover (on devices that can hover), on
 * keyboard focus, and toggled by a click or tap. A tap elsewhere or on another
 * tooltip closes it: iOS Safari doesn't focus a tapped button, so blur alone
 * can't. The visible text stays the button's name; the tooltip is its
 * description.
 */
const Tip = ({
  tip,
  children,
  className = "",
  wide = false,
  help = true,
}: {
  tip: ReactNode;
  children: ReactNode;
  className?: string;
  /** For long, multi-paragraph tips: wider, but never wider than the viewport. */
  wide?: boolean;
  /** Show the help cursor; off where the text isn't text to read, e.g. an icon. */
  help?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  // Where the tip goes on screen. Fixed, so no scrolling card or dialog
  // around it can clip it.
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tipRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    closeOpenTip?.();
    closeOpenTip = close;
    const closeOutside = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      if (closeOpenTip === close) closeOpenTip = null;
    };
  }, [open]);

  // Once the tooltip is showing, put it under its text, or over it if it
  // would pass the viewport's bottom edge, pulled left if it would pass the
  // right edge.
  const place = () =>
    requestAnimationFrame(() => {
      const el = tipRef.current;
      const anchor = rootRef.current;
      if (!el || !anchor) return;
      const { left, top, bottom } = anchor.getBoundingClientRect();
      const { width, height } = el.getBoundingClientRect();
      const max = document.documentElement.clientWidth - EDGE - width;
      const below = bottom + 4 + height <= window.innerHeight - EDGE;
      setPos({
        top: below ? bottom + 4 : Math.max(EDGE, top - 4 - height),
        left: Math.max(EDGE, Math.min(left, max)),
      });
    });

  // A tip that stays open follows its text as the page scrolls.
  // biome-ignore lint/correctness/useExhaustiveDependencies: place only reads refs
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", place, true);
    return () => window.removeEventListener("scroll", place, true);
  }, [open]);

  return (
    <span ref={rootRef} className="group relative inline-flex">
      <button
        type="button"
        aria-describedby={id}
        onClick={(e) => {
          // A tap shows the tip; it mustn't also open the row it sits in.
          e.stopPropagation();
          setOpen((o) => !o);
          place();
        }}
        onFocus={place}
        onMouseEnter={place}
        onBlur={() => setOpen(false)}
        className={`${help ? "cursor-help" : ""} ${className}`}
      >
        {children}
      </button>
      <span
        id={id}
        ref={tipRef}
        role="tooltip"
        style={pos}
        className={`${
          open ? "block" : "hidden"
        } group-hover:block group-has-focus-visible:block fixed z-50 w-max ${
          wide ? "max-w-[min(24rem,calc(100vw-1rem))]" : "max-w-64"
        } whitespace-normal rounded font-sans bg-gray-900 px-2 py-1 text-xs font-normal text-white shadow`}
      >
        {tip}
      </span>
    </span>
  );
};

export default Tip;
