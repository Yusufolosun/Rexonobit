# ThemeToggle

An icon button that switches between dark and light colour themes. Uses `useTheme` to read and toggle the current theme stored in `localStorage`.

## Import

```tsx
import { ThemeToggle } from "@/components/ThemeToggle";
```

## Props

No props — theme state is managed entirely by `useTheme`.

## Behaviour

- Displays a sun ☀️ SVG icon when in **dark mode** (click to switch to light).
- Displays a moon 🌙 SVG icon when in **light mode** (click to switch to dark).
- Persists the selected theme via `useTheme` → `localStorage`.

## Accessibility

- Button has `aria-label="Switch to light mode"` or `"Switch to dark mode"` depending on current state.
- SVG icons are `aria-hidden="true"` (decorative).

## Example

```tsx
import { ThemeToggle } from "@/components/ThemeToggle";

// Placed in Navbar
<nav>
  <ThemeToggle />
</nav>
```

## Dependencies

- `useTheme` hook — reads and toggles `theme` in `localStorage`

## CSS

The toggle adapts to `data-theme="dark"` / `data-theme="light"` attributes set on `document.documentElement` by `useTheme`.
