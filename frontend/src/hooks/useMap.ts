import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// useMap — reactive ES6 Map state
// ---------------------------------------------------------------------------

interface UseMapResult<K, V> {
  map: Map<K, V>;
  set: (key: K, value: V) => void;
  delete: (key: K) => void;
  get: (key: K) => V | undefined;
  has: (key: K) => boolean;
  clear: () => void;
  reset: (entries?: [K, V][]) => void;
  size: number;
}

/**
 * Manages a `Map<K, V>` as React state.  All mutating methods produce a new
 * Map instance, triggering a re-render only when content changes.
 *
 * @param initialEntries  Optional initial key-value pairs
 *
 * @example
 * const { map, set, delete: del, get } = useMap<string, number>();
 * set("alice", 750);  // re-renders with Map { "alice" => 750 }
 * get("alice");      // 750
 */
export function useMap<K, V>(initialEntries?: [K, V][]): UseMapResult<K, V> {
  const [map, setMap] = useState<Map<K, V>>(() => new Map(initialEntries));

  const setEntry = useCallback((key: K, value: V) => {
    setMap((prev) => new Map(prev).set(key, value));
  }, []);

  const deleteEntry = useCallback((key: K) => {
    setMap((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const get = useCallback(
    (key: K) => map.get(key),
    [map]
  );

  const has = useCallback(
    (key: K) => map.has(key),
    [map]
  );

  const clear = useCallback(() => setMap(new Map()), []);

  const reset = useCallback(
    (entries?: [K, V][]) => setMap(new Map(entries)),
    []
  );

  return {
    map,
    set: setEntry,
    delete: deleteEntry,
    get,
    has,
    clear,
    reset,
    size: map.size,
  };
}

export default useMap;
