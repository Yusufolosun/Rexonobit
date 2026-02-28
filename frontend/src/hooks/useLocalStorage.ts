// frontend/src/hooks/useLocalStorage.ts
// Type-safe localStorage hook with JSON serialisation and SSR safety

import { useState, useCallback } from "react";

/**
 * `useState` backed by `localStorage` with JSON serialisation.
 *
 * - Reads the stored value on first render (or falls back to `initialValue`).
 * - Writes to `localStorage` on every state update.
 * - SSR-safe: falls back silently when `localStorage` is unavailable.
 * - Returns the same `[value, setValue, removeValue]` tuple shape.
 *
 * @param key           localStorage key
 * @param initialValue  Fallback value when the key is not set
 *
 * @example
 * const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Quota exceeded or private-mode restriction — silently ignore
        }
        return next;
      });
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Silently ignore
    }
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
