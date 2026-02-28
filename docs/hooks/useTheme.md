# useTheme

**File:** `frontend/src/hooks/useTheme.ts`

## Purpose

Manages the application colour theme (dark/light). Reads from and writes to `localStorage` to persist the user's preference across sessions. Applies the chosen theme by setting the `data-theme` attribute on `document.documentElement`.

## Signature

```ts
function useTheme(): { theme: Theme; toggleTheme: () => void }
```

## Types

```ts
type Theme = "dark" | "light";
```

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `theme` | `Theme` | Current active theme |
| `toggleTheme` | `() => void` | Switch between dark and light |

## Persistence Key

`localStorage` key: `"rexonobit-theme"`

## CSS Integration

When theme is `"light"`, the hook sets `data-theme="light"` on `<html>`. This activates the `[data-theme="light"]` CSS variable block in `index.css`, overriding the default dark palette.

## Example

```tsx
const { theme, toggleTheme } = useTheme();

<button onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
</button>
```

## Notes

- Default theme is `"dark"` if no preference has been saved.
- `ThemeToggle` component consumes this hook and handles the button rendering.
