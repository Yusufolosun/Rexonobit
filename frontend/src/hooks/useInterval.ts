// frontend/src/hooks/useInterval.ts
// Declarative setInterval hook — runs a callback on a fixed delay

import { useEffect, useRef } from "react";

/**
 * Calls `callback` at the given `delayMs` interval.
 * Pass `null` as `delayMs` to pause the interval.
 *
 * The callback reference is kept stable via a ref — no need to wrap in
 * `useCallback` at the call site.
 *
 * @param callback  Function to call on each tick
 * @param delayMs   Interval in milliseconds, or `null` to pause
 *
 * @example
 * // Refresh protocol stats every 30 seconds
 * useInterval(refreshStats, 30_000);
 *
 * // Pause polling while tab is in the background
 * useInterval(refreshStats, isVisible ? 30_000 : null);
 */
export function useInterval(
  callback: () => void,
  delayMs: number | null
): void {
  const savedCallback = useRef<() => void>(callback);

  // Keep the latest callback in a ref without restarting the interval
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
