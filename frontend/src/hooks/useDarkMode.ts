import { useState, useEffect, useCallback } from "react";

type ColorScheme = "dark" | "light";

interface DarkModeResult {
  /** Current active colour scheme */
  colorScheme: ColorScheme;
  /** Whether dark mode is active */
  isDark: boolean;
  /** Toggle between dark and light */
  toggle: () => void;
  /** Explicitly set a scheme */
  setScheme: (scheme: ColorScheme) => void;
  /** Revert to the system preference (removes stored override) */
  resetToSystem: () => void;
}

const STORAGE_KEY = "rexonobit-color-scheme";
const DATA_ATTR = "data-theme";

function getSystemScheme(): ColorScheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredScheme(): ColorScheme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    // localStorage blocked (e.g., private mode)
  }
  return null;
}

function applyScheme(scheme: ColorScheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(DATA_ATTR, scheme);
}

/**
 * useDarkMode
 *
 * Manages the application colour scheme (dark / light). Persists the user's
 * preference in localStorage and applies it as a `data-theme` attribute on
 * `<html>`. Falls back to the OS preference when no override is stored.
 *
 * @example
 * const { isDark, toggle } = useDarkMode();
 * return <button onClick={toggle}>{isDark ? "☀️ Light" : "🌙 Dark"}</button>;
 */
export function useDarkMode(): DarkModeResult {
  const [scheme, setSchemeState] = useState<ColorScheme>(() => {
    return getStoredScheme() ?? getSystemScheme();
  });

  // Apply scheme to DOM on change
  useEffect(() => {
    applyScheme(scheme);
  }, [scheme]);

  // Listen for OS preference changes (only affects when no override stored)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!getStoredScheme()) {
        setSchemeState(e.matches ? "dark" : "light");
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const setScheme = useCallback((s: ColorScheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch { /* ignore */ }
    setSchemeState(s);
  }, []);

  const toggle = useCallback(() => {
    setScheme(scheme === "dark" ? "light" : "dark");
  }, [scheme, setScheme]);

  const resetToSystem = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    setSchemeState(getSystemScheme());
  }, []);

  return {
    colorScheme: scheme,
    isDark: scheme === "dark",
    toggle,
    setScheme,
    resetToSystem,
  };
}
