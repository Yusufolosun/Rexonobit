# ProgressBar

`src/components/ProgressBar.tsx`

Accessible, reusable progress indicator backed by a native `role="progressbar"` element with full ARIA support.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | — | Current value (0 – `max`) |
| `max` | `number` | `100` | Maximum value |
| `label` | `string` | — | Visible label shown above the bar |
| `ariaLabel` | `string` | — | `aria-label` used when no visible label is provided |
| `height` | `number` | `8` | Bar height in pixels |
| `color` | `string` | `var(--color-primary)` | CSS colour for the filled segment |
| `className` | `string` | `""` | Extra class names for the wrapper |

---

## Usage

```tsx
import { ProgressBar } from "../components/ProgressBar";

// Basic
<ProgressBar value={65} />

// Trust score
<ProgressBar value={trustScore} max={1000} label="Trust Score" color="var(--color-primary)" />

// Loan utilization
<ProgressBar
  value={utilized}
  max={ceiling}
  label="Pool Utilization"
  height={12}
  color="var(--color-warning, #f59e0b)"
/>
```

---

## Accessibility

- Renders a `<div role="progressbar">` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
- `aria-label` is resolved from (in priority order): the `ariaLabel` prop → the `label` prop → the string `"Progress"`.
- The bar `value` is clamped between 0 and `max` before use, preventing invalid ARIA state.

---

## Integration Example

Used in `TrustScoreCard` to display the score bar:

```tsx
<ProgressBar
  value={score}
  max={1000}
  label="Trust Score"
  ariaLabel={`Trust score ${score} out of 1000`}
  color={tierColor}
/>
```
