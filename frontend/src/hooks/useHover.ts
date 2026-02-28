import { useState, useRef, useCallback, RefObject } from "react";
import type React from "react";

interface HoverState {
  /** Whether the element is currently hovered */
  isHovered: boolean;
  /** Ref to attach to the target element */
  ref: RefObject<HTMLElement>;
}

/**
 * useHover
 *
 * Tracks whether the user is hovering over a DOM element.
 * Returns a ref to attach to the target and a boolean `isHovered`.
 *
 * @example
 * const { ref, isHovered } = useHover<HTMLDivElement>();
 * return <div ref={ref}>{isHovered ? "Hovering!" : "Hover me"}</div>;
 */
export function useHover<T extends HTMLElement = HTMLElement>(): {
  ref: RefObject<T>;
  isHovered: boolean;
} {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<T>(null);

  // Use useCallback to keep stable references
  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);

  // Attach listeners imperatively to avoid needing a callback ref
  const setRef = useCallback(
    (node: T | null) => {
      if ((ref as React.MutableRefObject<T | null>).current) {
        (ref as React.MutableRefObject<T | null>).current!.removeEventListener("mouseenter", onMouseEnter);
        (ref as React.MutableRefObject<T | null>).current!.removeEventListener("mouseleave", onMouseLeave);
      }
      (ref as React.MutableRefObject<T | null>).current = node;
      if (node) {
        node.addEventListener("mouseenter", onMouseEnter);
        node.addEventListener("mouseleave", onMouseLeave);
      }
    },
    [onMouseEnter, onMouseLeave]
  );

  return { ref: setRef as unknown as RefObject<T>, isHovered };
}
