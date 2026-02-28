// frontend/src/hooks/usePrevious.ts
// Returns the value of a variable from the previous render cycle

import { useRef, useEffect } from "react";

/**
 * Returns the value of `value` from the previous render.
 * Returns `undefined` on the first render.
 *
 * Useful for detecting changes: e.g. showing a toast when a value transitions.
 *
 * @param value  The value to track
 * @returns      Previous render's value (or `undefined` on first render)
 *
 * @example
 * const prevBalance = usePrevious(balance);
 * useEffect(() => {
 *   if (prevBalance !== undefined && balance > prevBalance) {
 *     toast.success("Balance increased!");
 *   }
 * }, [balance, prevBalance]);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
