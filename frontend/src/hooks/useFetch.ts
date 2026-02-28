import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// useFetch — generic fetch with loading / error / data state
// ---------------------------------------------------------------------------

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches a JSON endpoint and manages `data`, `loading`, and `error` state.
 * Aborts the in-flight request when the component unmounts or `url` changes.
 *
 * @param url      Full URL to fetch (pass `null` or `""` to skip)
 * @param options  Optional `RequestInit` options forwarded to `fetch()`
 *
 * @example
 * const { data, loading, error } = useFetch<MemberInfo>(
 *   `${STACKS_API}/v2/accounts/${address}`
 * );
 */
export function useFetch<T = unknown>(
  url: string | null,
  options?: RequestInit
): UseFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; });

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    // Defer state updates to avoid synchronous setState in effect body
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    fetch(url, { ...optionsRef.current, signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json() as Promise<T>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [url, trigger]);

  const refetch = useCallback(() => setTrigger((n) => n + 1), []);

  return { data, loading, error, refetch };
}

export default useFetch;
