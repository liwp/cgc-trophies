import { type ReactNode, useEffect, useId, useRef, useState } from "react";

/** Space kept between a tooltip and the viewport's right edge, in px. */
const EDGE = 8;

/** How long a hovered tip stays after the pointer leaves, in ms. */
const LINGER = 300;

/**
 * How long the pointer must rest on a label before its tip opens, in ms, so
 * passing over labels doesn't open them.
 */
const HOVER_DELAY = 350;

/** Closes the open tooltip, so that opening another closes it. */
let closeOpenTip: (() => void) | null = null;

/**
 * Hides the tip shown (or lingering) by hover. While one is, a neighbouring
 * tip opens at once and this one closes straight away: one hover tip at a
 * time.
 */
let hideHoverTip: (() => void) | null = null;

/**
 * Inline text with a tooltip shown on hover once the pointer rests on it
 * (lingering a moment after the pointer leaves, and while it's on the
 * tooltip; only one hover tooltip shows at a time), on
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
  // Under a mouse pointer. It lingers after the pointer leaves, so the
  // pointer can cross the gap onto the tip itself and stay to read it.
  const [hovered, setHovered] = useState(false);
  const linger = useRef<ReturnType<typeof setTimeout>>(undefined);
  const delay = useRef<ReturnType<typeof setTimeout>>(undefined);
  // This tip's own hide, so the shared slot can tell whose it is.
  const hide = useRef(() => {
    clearTimeout(linger.current);
    setHovered(false);
    if (hideHoverTip === hide.current) hideHoverTip = null;
  });
  useEffect(
    () => () => {
      clearTimeout(linger.current);
      clearTimeout(delay.current);
      if (hideHoverTip === hide.current) hideHoverTip = null;
    },
    [],
  );
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
    <span
      ref={rootRef}
      className="group relative inline-flex"
      // On the label or the tip (a child, though placed elsewhere on screen).
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(linger.current);
        // Back on its own label or tip while it lingers.
        if (hideHoverTip === hide.current) return;
        const show = () => {
          hideHoverTip?.();
          hideHoverTip = hide.current;
          place();
          setHovered(true);
        };
        if (hideHoverTip) show();
        else delay.current = setTimeout(show, HOVER_DELAY);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimeout(delay.current);
        if (hideHoverTip === hide.current)
          linger.current = setTimeout(hide.current, LINGER);
      }}
    >
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
          open || hovered ? "block" : "hidden"
        } group-has-focus-visible:block fixed z-50 w-max ${
          wide ? "max-w-[min(24rem,calc(100vw-1rem))]" : "max-w-64"
        } whitespace-normal rounded font-sans bg-gray-900 px-2 py-1 text-xs font-normal text-white shadow`}
      >
        {tip}
      </span>
    </span>
  );
};

export default Tip;
