import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Opens each new page at the top. BrowserRouter keeps the window's scroll
 * position across client-side navigation, so a link followed from far down
 * one page would open the next just as far down. Back and Forward (POP) are
 * left alone, so the browser can restore where the reader was. So are
 * changes within a page (its query, e.g. the season, or a #fragment).
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const type = useNavigationType();
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs per page, not per navigation type
  useLayoutEffect(() => {
    if (type !== "POP") window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default ScrollToTop;
