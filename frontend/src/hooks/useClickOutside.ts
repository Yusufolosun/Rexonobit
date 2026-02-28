import { useEffect, RefObject } from "react";

// ---------------------------------------------------------------------------
// useClickOutside — call a handler when the user clicks outside an element
// ---------------------------------------------------------------------------

/**
 * Attaches a `mousedown` listener to `document` and calls `handler` whenever
 * the click target is outside the referenced element.
 *
 * @param ref    React ref attached to the element to watch
 * @param handler  Callback to invoke on an outside click
 * @param enabled  Set to `false` to temporarily disable the listener (default: true)
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setOpen(false));
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent) => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;

    function listener(event: MouseEvent) {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    }

    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler, enabled]);
}

export default useClickOutside;
