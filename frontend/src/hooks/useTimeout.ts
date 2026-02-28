import { useCallback, useEffect, useRef } from "react";

/**
 * useTimeout
 *
 * Calls a callback once after a given delay in milliseconds.
 * The timer is automatically cleared on unmount.
 * Calling `set()` re-starts the timer; `clear()` cancels it.
 *
 * @example
 * const { set, clear } = useTimeout(() => setShowBanner(false), 4000);
 * // Auto-dismiss banner 4 seconds after mount:
 * useEffect(() => { set(); }, [set]);
 */
export function useTimeout(
  callback: () => void,
  delay: number
): { set: () => void; clear: () => void } {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Keep callback current without re-creating handles.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Track mounted state.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const set = useCallback(() => {
    clear();
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) callbackRef.current();
    }, delay);
  }, [clear, delay]);

  // Clear on unmount.
  useEffect(() => () => clear(), [clear]);

  return { set, clear };
}
