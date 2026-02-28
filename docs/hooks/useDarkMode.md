# useDarkMode

**Location:** `frontend/src/hooks/useDarkMode.ts`

Manages the application colour scheme. Persists the user's preference in `localStorage`, applies it as a `data-theme` attribute on `<html>`, and syncs with the OS preference when no override is stored.

---

## Return Value

```ts
{
  colorScheme: "dark" | "light";   // Active scheme
  isDark: boolean;                  // Convenience flag
  toggle: () => void;               // Flip between dark and light
  setScheme: (s: ColorScheme) => void; // Explicitly set a scheme
  resetToSystem: () => void;        // Remove override, restore OS preference
}
```

---

## Usage

```tsx
import { useDarkMode } from "@/hooks/useDarkMode";

function ThemeToggle() {
  const { isDark, toggle } = useDarkMode();
  return (
    <button onClick={toggle} aria-label="Toggle theme">
      {isDark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
```

---

## CSS Integration

The hook sets `data-theme="dark"` or `data-theme="light"` on `<html>`. Wire this to your CSS variables:

```css
:root, [data-theme="light"] {
  --color-bg: #ffffff;
  --color-text-primary: #0f172a;
}

[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-text-primary: #f1f5f9;
}
```

---

## Persistence

| Action | localStorage | Effect |
|--------|-------------|--------|
| `toggle()` | Stores new value | Stays until user changes |
| `setScheme("light")` | Stores `"light"` | Overrides OS preference |
| `resetToSystem()` | Removed | Reverts to OS preference |

---

## Notes

- `localStorage` access is wrapped in try/catch for private/restricted mode compatibility.
- OS preference changes (e.g., switching macOS to dark mode) are reflected live when no stored override is present.
