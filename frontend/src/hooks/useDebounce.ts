// frontend/src/hooks/useDebounce.ts
// Generic debounce hook — delays updating a value until after a quiet period

import { useState, useEffect } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delayMs`
 * milliseconds have elapsed without a new value being provided.
 *
 * Useful for search inputs and form validation to avoid firing on every keystroke.
 *
 * @param value    The value to debounce
 * @param delayMs  Quiet period in milliseconds (default 300)
 * @returns        Debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 400);
 * useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
