// frontend/src/hooks/useContractError.ts
// Centralised contract error state with classification helpers

/**
 * @module useContractError
 * @description Utility hook for managing contract call error state in panels.
 * Provides `error`, `setError`, and `clearError` with automatic timeout
 * dismissal. Wraps async calls with standardised error extraction.
 *
 * @example
 * ```ts
 * const { error, clearError, wrap } = useContractError();
 * await wrap(() => depositSTX(amount));
 * ```
 */

import { useState, useCallback } from "react";

export interface UseContractErrorResult {
  /** Current error message, or null if no error. */
  error: string | null;
  /** Manually set an error message. */
  setError: (msg: string) => void;
  /** Clear the current error. */
  clearError: () => void;
  /**
   * Wrap an async contract call: sets `error` on failure, clears on success.
   * Returns the result on success, or null on failure.
   */
  wrap: <T>(fn: () => Promise<T>, successMsg?: (res: T) => void) => Promise<T | null>;
}

/**
 * Extract a human-readable message from a caught error.
 * Handles Clarity error tuples, fetch errors, and plain strings.
 */
function extractMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
    if (typeof e.reason === "string") return e.reason;
    if (typeof e.cause === "string") return e.cause;
  }
  return "An unexpected error occurred.";
}

/**
 * Centralised error state hook for contract interactions.
 * @param autoClearMs - milliseconds after which the error auto-dismisses (default 6000)
 */
export function useContractError(autoClearMs = 6000): UseContractErrorResult {
  const [error, setErrorState] = useState<string | null>(null);
  const [timerId, setTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const setError = useCallback(
    (msg: string) => {
      setErrorState(msg);
      if (timerId) clearTimeout(timerId);
      const id = setTimeout(() => setErrorState(null), autoClearMs);
      setTimerId(id);
    },
    [autoClearMs, timerId]
  );

  const clearError = useCallback(() => {
    if (timerId) clearTimeout(timerId);
    setErrorState(null);
  }, [timerId]);

  const wrap = useCallback(
    async <T,>(fn: () => Promise<T>, successMsg?: (res: T) => void): Promise<T | null> => {
      try {
        const result = await fn();
        clearError();
        successMsg?.(result);
        return result;
      } catch (err) {
        setError(extractMessage(err));
        return null;
      }
    },
    [setError, clearError]
  );

  return { error, setError, clearError, wrap };
}

export default useContractError;
