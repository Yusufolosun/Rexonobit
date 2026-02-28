# StatCard

`src/components/StatCard.tsx`

Compact at-a-glance metric card used across protocol dashboards. Supports a skeleton loading state and an optional left-border accent colour.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Metric title (e.g. `"Total Locked STX"`) |
| `value` | `string` | — | Formatted value string (e.g. `"1,234.56 STX"`) |
| `sub` | `string` | — | Secondary info shown below the value |
| `icon` | `React.ReactNode` | — | Icon element to the left of the value |
| `accentColor` | `string` | `var(--color-primary)` | CSS colour for the left border stripe |
| `className` | `string` | `""` | Extra class names for the wrapper |
| `loading` | `boolean` | `false` | Show animated skeleton instead of value |

---

## Usage

```tsx
import { StatCard } from "../components/StatCard";
import { formatMicroSTX } from "../lib/format";

// Basic
<StatCard title="Total Deposited" value={formatMicroSTX(totalDeposited)} />

// With icon, sub text, and accent colour
<StatCard
  title="Active Loans"
  value={String(activeLoans)}
  sub="across all circles"
  icon="🏦"
  accentColor="var(--color-warning, #f59e0b)"
/>

// Loading state
<StatCard title="Pool Utilization" value="" loading={true} />
```

---

## Accessibility

- The wrapper element has `aria-label="{title}: {value}"` (or `"loading"` when `loading={true}`).
- The skeleton placeholder renders `aria-busy="true"` and `aria-label="Loading"`.
- Icon elements use `aria-hidden="true"` so they are not read by screen readers.

---

## Integration Example

Used in `ProtocolStats` for TVL, active member count, open loans, and ROSCA stat tiles.

```tsx
stats.map((s) => (
  <StatCard
    key={s.label}
    title={s.label}
    value={s.formatted}
    loading={loading}
    accentColor={s.color}
  />
))
```
