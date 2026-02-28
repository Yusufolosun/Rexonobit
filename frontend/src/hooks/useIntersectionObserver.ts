import { useState, useEffect, useRef } from "react";
import type { RefObject } from "react";

interface IntersectionOptions extends IntersectionObserverInit {
  /** Freeze the observed state once the element becomes visible. Default false. */
  freezeOnceVisible?: boolean;
}

interface IntersectionResult {
  /** The raw IntersectionObserverEntry, or null before first observation */
  entry: IntersectionObserverEntry | null;
  /** Whether the element is currently intersecting the viewport/root */
  isIntersecting: boolean;
  /** Ref to attach to the target element */
  ref: RefObject<HTMLElement | null>;
}

/**
 * useIntersectionObserver
 *
 * Tracks whether a DOM element intersects the viewport (or a custom root)
 * using the native IntersectionObserver API.
 *
 * @param options  Standard IntersectionObserver options plus `freezeOnceVisible`
 *
 * @example
 * // Lazy-load when the element scrolls into view
 * const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
 * return <div ref={ref}>{isIntersecting ? <HeavyComponent /> : null}</div>;
 *
 * // Trigger animation once
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.2,
 *   freezeOnceVisible: true,
 * });
 */
export function useIntersectionObserver(
  options: IntersectionOptions = {}
): IntersectionResult {
  const {
    threshold = 0,
    root = null,
    rootMargin = "0px",
    freezeOnceVisible = false,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const frozen = entry?.isIntersecting && freezeOnceVisible;

  useEffect(() => {
    const element = ref.current;
    if (!element || frozen || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([observedEntry]) => {
        setEntry(observedEntry);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, root, rootMargin, frozen]);

  return {
    ref,
    entry,
    isIntersecting: entry?.isIntersecting ?? false,
  };
}
