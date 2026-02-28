# LoadingSpinner

**Location:** `frontend/src/components/LoadingSpinner.tsx`

Lightweight, accessible SVG spinner for loading states. Rendered as a pure SVG with inline CSS animation — no dependencies other than React.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | `"md"` | Physical size (14 / 20 / 28 / 40 px) |
| `color` | `"accent" \| "white" \| "muted" \| string` | `"accent"` | Stroke color. Use named tokens or any CSS color |
| `label` | `string` | `"Loading…"` | Screen-reader label (`aria-label`) |
| `centered` | `boolean` | `false` | Wraps spinner in a flex container with padding |
| `className` | `string` | `""` | Extra CSS class names |

---

## Usage

```tsx
import LoadingSpinner from "@/components/LoadingSpinner";

// Inline in a button
<button disabled={loading}>
  {loading && <LoadingSpinner size="xs" color="white" />}
  Submit
</button>

// Full-section centered
{isLoading && <LoadingSpinner size="lg" centered label="Loading circle data…" />}

// Custom color
<LoadingSpinner color="#10b981" />
```

---

## Accessibility

- SVG has `role="status"` and `aria-label` for screen reader announcement.
- Spinner is purely decorative when placed alongside visible text — in that case `aria-hidden="true"` can optionally be added on the parent.

---

## Styling

Adds class `.loading-spinner` to the SVG element for CSS overrides. The spin animation is injected via a `<style>` tag scoped to the SVG document.

---

## Dependencies

- React 18
- No external dependencies
