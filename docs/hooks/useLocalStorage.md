# useLocalStorage

**File:** `frontend/src/hooks/useLocalStorage.ts`

## Purpose

Type-safe `localStorage` hook. Provides a `useState`-compatible API backed by browser `localStorage` with automatic JSON serialisation. Used by `useTheme` to persist the selected colour scheme.

## Signature

```ts
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void]
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | `localStorage` key |
| `initialValue` | `T` | Fallback when key is not set |

## Returns

| Index | Type | Description |
|-------|------|-------------|
| `[0]` | `T` | Current stored value |
| `[1]` | `setValue` | Update the stored value |
| `[2]` | `removeValue` | Delete the key and reset to `initialValue` |

## Example

```ts
const [theme, setTheme, clearTheme] = useLocalStorage<"light" | "dark">("theme", "light");
setTheme("dark"); // persists across page reloads
clearTheme();     // removes key, reverts to "light"
```

## Notes

- Silently ignores `QuotaExceededError` (private browsing / storage full).
- `setValue` accepts a function `(prev: T) => T` for functional updates, matching the `useState` API.
- SSR-safe: falls back to `initialValue` when `window.localStorage` throws.
