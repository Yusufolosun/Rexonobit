import { useCallback, useEffect, useRef, useState } from "react";

interface UsePollingOptions {
  /** Polling interval in milliseconds. Default: 15 000 ms (15 seconds). */
  interval?: number;
  /** Whether to run the callback immediately on mount / start. Default: true. */
  immediate?: boolean;
  /** Start in active polling state. Default: true. */
  enabled?: boolean;
}

interface UsePollingReturn {
  /** Whether polling is currently active. */
  isPolling: boolean;
  /** Start (or restart) polling. */
  start: () => void;
  /** Stop polling without triggering a final call. */
  stop: () => void;
  /** Pause and resume in one call. */
  toggle: () => void;
  /** Force an immediate invocation outside the regular interval. */
  runNow: () => void;
}

/**
 * usePolling
 *
 * Repeatedly calls an async callback at a fixed interval.
 * Handles cleanup on unmount and prevents stale-closure issues by
 * keeping the latest callback in a ref.
 *
 * @example
 * const { isPolling, stop } = usePolling(fetchChainTip, { interval: 10_000 });
 */
export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions = {}
): UsePollingReturn {
  const {
    interval = 15_000,
    immediate = true,
    enabled = true,
  } = options;

  const [isPolling, setIsPolling] = useState(enabled);
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Keep latest callback in ref to avoid stale closures.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Track mounted state for safe async updates.
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!mountedRef.current) return;
    clearTimer();
    setIsPolling(true);
    timerRef.current = setInterval(() => {
      if (mountedRef.current) void callbackRef.current();
    }, interval);
  }, [clearTimer, interval]);

  const stop = useCallback(() => {
    clearTimer();
    setIsPolling(false);
  }, [clearTimer]);

  const toggle = useCallback(() => {
    if (isPolling) { stop(); } else { start(); }
  }, [isPolling, start, stop]);

  const runNow = useCallback(() => {
    void callbackRef.current();
  }, []);

  // Start / stop when `isPolling` or `interval` change.
  useEffect(() => {
    if (!isPolling) {
      clearTimer();
      return;
    }
    if (immediate) void callbackRef.current();
    timerRef.current = setInterval(() => {
      if (mountedRef.current) void callbackRef.current();
    }, interval);
    return clearTimer;
  }, [isPolling, interval, immediate, clearTimer]);

  // Sync with `enabled` prop changes after initial mount.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (enabled) { start(); } else { stop(); }
  }, [enabled, start, stop]);

  return { isPolling, start, stop, toggle, runNow };
}
