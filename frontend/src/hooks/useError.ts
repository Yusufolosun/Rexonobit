import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// useError — lightweight error state with set / clear helpers
// ---------------------------------------------------------------------------

interface UseErrorReturn {
  error: string | null;
  hasError: boolean;
  setError: (message: string) => void;
  clearError: () => void;
  wrapAsync: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}

/**
 * Manages a single error string with ergonomic helpers.
 *
 * `wrapAsync` runs an async function, auto-captures thrown errors as the
 * error string, and auto-clears before each run.
 *
 * @example
 * const { error, setError, clearError, wrapAsync } = useError();
 *
 * const handleSubmit = () =>
 *   wrapAsync(async () => {
 *     await submitTx(...);
 *   });
 */
export function useError(): UseErrorReturn {
  const [error, setErrorState] = useState<string | null>(null);

  const setError = useCallback((message: string) => {
    setErrorState(message);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const wrapAsync = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      setErrorState(null);
      try {
        return await fn();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : String(err);
        setErrorState(message);
        return undefined;
      }
    },
    []
  );

  return {
    error,
    hasError: error !== null,
    setError,
    clearError,
    wrapAsync,
  };
}

export default useError;
