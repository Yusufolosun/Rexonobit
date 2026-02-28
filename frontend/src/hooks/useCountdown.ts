import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// useCountdown — count down from a given number of seconds
// ---------------------------------------------------------------------------

interface UseCountdownResult {
  /** Remaining seconds */
  remaining: number;
  /** Whether the countdown is running */
  isRunning: boolean;
  /** Start or restart the countdown */
  start: () => void;
  /** Pause the countdown */
  pause: () => void;
  /** Reset to initial value without starting */
  reset: () => void;
}

/**
 * Counts down from `initialSeconds` to 0 at 1 s intervals.
 *
 * @param initialSeconds  Starting value in seconds
 * @param onComplete      Optional callback invoked when remaining reaches 0
 *
 * @example
 * const { remaining, start, pause, reset } = useCountdown(30, () => handleExpiry());
 */
export function useCountdown(
  initialSeconds: number,
  onComplete?: () => void
): UseCountdownResult {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stop = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          stop();
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current != null) clearInterval(intervalRef.current);
    };
  }, [isRunning, stop]);

  const start = useCallback(() => {
    if (remaining > 0) setIsRunning(true);
  }, [remaining]);

  const pause = useCallback(() => {
    stop();
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setRemaining(initialSeconds);
  }, [stop, initialSeconds]);

  return { remaining, isRunning, start, pause, reset };
}

export default useCountdown;
