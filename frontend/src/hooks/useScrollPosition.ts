import { useEffect, useState } from "react";

interface ScrollPosition {
  /** Horizontal scroll offset in pixels. */
  x: number;
  /** Vertical scroll offset in pixels. */
  y: number;
  /** Whether the page has been scrolled past the threshold. */
  isScrolled: boolean;
  /** Scroll direction since last significant move: "up" | "down" | null. */
  direction: "up" | "down" | null;
}

interface UseScrollPositionOptions {
  /**
   * Pixels scrolled vertically before `isScrolled` becomes `true`.
   * Defaults to `10`.
   */
  threshold?: number;
  /**
   * Minimum pixel delta to register a direction change.
   * Defaults to `5`.
   */
  directionDelta?: number;
}

/**
 * useScrollPosition
 *
 * Tracks the current window scroll position, whether the page has been
 * scrolled past a threshold, and the current scroll direction.
 *
 * Useful for sticky navbars, back-to-top buttons, and infinite scroll.
 *
 * @example
 * const { y, isScrolled, direction } = useScrollPosition({ threshold: 80 });
 * // Hide navbar on scroll-down, reveal on scroll-up
 */
export function useScrollPosition(
  options: UseScrollPositionOptions = {}
): ScrollPosition {
  const { threshold = 10, directionDelta = 5 } = options;

  const [position, setPosition] = useState<ScrollPosition>({
    x: 0,
    y: 0,
    isScrolled: false,
    direction: null,
  });

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const x = window.scrollX;
      const y = window.scrollY;
      const delta = y - lastY;

      let direction: "up" | "down" | null = null;
      if (Math.abs(delta) >= directionDelta) {
        direction = delta > 0 ? "down" : "up";
        lastY = y;
      }

      setPosition((prev) => ({
        x,
        y,
        isScrolled: y > threshold,
        direction: direction ?? prev.direction,
      }));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, directionDelta]);

  return position;
}
