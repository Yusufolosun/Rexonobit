// frontend/src/hooks/useWindowFocus.ts
// Triggers a callback whenever the browser window/tab regains focus.
// Useful for refetching stale data without polling.

import { useEffect } from 'react';

/**
 * Calls the provided callback whenever the window gains focus.
 * @param callback - Function to invoke on window focus.
 */
export function useWindowFocus(callback: () => void): void {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [callback]);
}
