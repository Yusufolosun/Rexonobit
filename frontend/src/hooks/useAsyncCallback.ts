import { useState, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// useAsyncCallback — wrap any async function with loading/error tracking
// ---------------------------------------------------------------------------

interface UseAsyncCallbackReturn<Args extends unknown[], R> {
  execute: (...args: Args) => Promise<R | undefined>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Wraps an async callback and tracks its `loading` and `error` state.
 * Safe to call after component unmount — updates are skipped if unmounted.
 *
 * @param fn  The async function to wrap.
 *
 * @example
 * const { execute: fundPool, loading } = useAsyncCallback(async (amount: number) => {
 *   await doContractCall({ ... });
 * });
 */
export function useAsyncCallback<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>
): UseAsyncCallbackReturn<Args, R> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Track mount state for cleanup safety
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const execute = useCallback(
    async (...args: Args): Promise<R | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fnRef.current(...args);
        if (mountedRef.current) setLoading(false);
        return result;
      } catch (err: unknown) {
        if (!mountedRef.current) return undefined;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setLoading(false);
        return undefined;
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { execute, loading, error, clearError };
}

export default useAsyncCallback;
