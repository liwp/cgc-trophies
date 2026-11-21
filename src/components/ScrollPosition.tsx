import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/** Where each history entry's scroll positions are kept, across reloads. */
const STORE = "scroll-positions";

/** How long to keep trying to restore a position while a page fills in. */
const RESTORE_FOR = 1000;

const load = (): Record<string, number> => {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? "{}");
  } catch {
    return {};
  }
};

const save = (positions: Record<string, number>) => {
  try {
    sessionStorage.setItem(STORE, JSON.stringify(positions));
  } catch {
    // Storage can be full or blocked; the positions then last as long as
    // the page.
  }
};

/**
 * Manages the window's scroll across client-side navigation, which the
 * browser can't: a new page (push or replace to another path) opens at the
 * top, rather than as far down as the last one was. Back and Forward (POP)
 * return to where the reader was on that entry, once the page is tall enough
 * again; the browser's own restoring happens before React has redrawn the
 * page, so it lands short. Changes within a page (its query, e.g. the
 * season, or a #fragment) leave the scroll alone.
 */
const ScrollPosition = () => {
  const { pathname, key } = useLocation();
  const type = useNavigationType();
  // Loaded before the first restore, so a reload returns to its place.
  const [positions] = useState<Record<string, number>>(load);
  const current = useRef(key);
  const path = useRef(pathname);

  // Remember each entry's position as the reader scrolls, and keep it over a
  // reload.
  useEffect(() => {
    window.history.scrollRestoration = "manual";
    const onScroll = () => {
      positions[current.current] = window.scrollY;
    };
    const persist = () => save(positions);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
      persist();
    };
  }, [positions]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs per entry; the type and path are read for that entry
  useLayoutEffect(() => {
    current.current = key;
    const pathChanged = path.current !== pathname;
    path.current = pathname;
    if (type === "POP") {
      const saved = positions[key];
      if (saved === undefined) return;
      // Keep trying until the page has grown tall enough to get there.
      const until = performance.now() + RESTORE_FOR;
      let frame = 0;
      const restore = () => {
        window.scrollTo(0, saved);
        if (Math.abs(window.scrollY - saved) > 1 && performance.now() < until)
          frame = requestAnimationFrame(restore);
      };
      restore();
      return () => cancelAnimationFrame(frame);
    }
    if (pathChanged) window.scrollTo(0, 0);
    // The same page under a new entry (the season, or the flight pop-up)
    // keeps its place.
    else positions[key] = window.scrollY;
  }, [key]);

  return null;
};

export default ScrollPosition;
