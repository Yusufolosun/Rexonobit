// frontend/src/hooks/useMediaQuery.ts
// Reactive CSS media query hook — returns true when the query matches

import { useState, useEffect } from "react";

/**
 * Returns `true` when the given CSS media query matches, reactively updating
 * when the viewport changes.
 *
 * @param query  A CSS media query string, e.g. `"(max-width: 768px)"`
 * @returns      Boolean match state
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Modern API
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      // Legacy fallback
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, [query]);

  return matches;
}
