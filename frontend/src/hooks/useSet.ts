import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// useSet — reactive ES6 Set state
// ---------------------------------------------------------------------------

interface UseSetResult<T> {
  set: Set<T>;
  add: (value: T) => void;
  remove: (value: T) => void;
  toggle: (value: T) => void;
  has: (value: T) => boolean;
  clear: () => void;
  reset: (values?: T[]) => void;
  size: number;
}

/**
 * Manages a `Set<T>` as React state.  All mutating methods produce a new Set
 * instance, triggering a re-render only when membership changes.
 *
 * @param initialValues  Optional initial values
 *
 * @example
 * const { set, add, remove, has } = useSet<string>(["alice"]);
 * add("bob");   // re-renders with { "alice", "bob" }
 * has("alice"); // true
 */
export function useSet<T>(initialValues?: T[]): UseSetResult<T> {
  const [set, setSet] = useState<Set<T>>(() => new Set(initialValues));

  const add = useCallback((value: T) => {
    setSet((prev) => {
      if (prev.has(value)) return prev;
      return new Set([...prev, value]);
    });
  }, []);

  const remove = useCallback((value: T) => {
    setSet((prev) => {
      if (!prev.has(value)) return prev;
      const next = new Set(prev);
      next.delete(value);
      return next;
    });
  }, []);

  const toggle = useCallback((value: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const has = useCallback(
    (value: T) => set.has(value),
    [set]
  );

  const clear = useCallback(() => setSet(new Set()), []);

  const reset = useCallback(
    (values?: T[]) => setSet(new Set(values)),
    []
  );

  return { set, add, remove, toggle, has, clear, reset, size: set.size };
}

export default useSet;
