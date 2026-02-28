# StatusChip

**Location:** `frontend/src/components/StatusChip.tsx`

A small colored pill badge for representing entity status (loan, circle, task, vault, etc.). Provides 10 semantic color variants with an optional dot indicator.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `StatusVariant` | *(required)* | Color scheme |
| `label` | `string` | Capitalized variant name | Display text |
| `dot` | `boolean` | `false` | Show a colored dot before the label |
| `className` | `string` | `""` | Extra CSS class names |

---

## Variants

| Variant | Use case | Colors |
|---------|----------|--------|
| `active` | Loans, circles, members in good standing | Green |
| `pending` | Awaiting action or confirmation | Amber |
| `completed` | Finished workflows | Blue |
| `failed` | Contract errors, rejected transactions | Red |
| `cancelled` | User-cancelled flows | Slate |
| `locked` | Vault locked, funds frozen | Purple |
| `open` | Open circle, open credit line | Sky |
| `paused` | Contract paused by governance | Orange |
| `warning` | Near-delinquency, upcoming deadline | Yellow |
| `info` | Neutral informational state | Indigo |

---

## Usage

```tsx
import StatusChip from "@/components/StatusChip";

// Basic
<StatusChip variant="active" />

// Custom label
<StatusChip variant="pending" label="Awaiting payout" />

// With dot indicator
<StatusChip variant="locked" label="Vault locked" dot />

// In a table
<td><StatusChip variant={toLoanStatusVariant(loan.status)} dot /></td>
```

### Mapping contract status codes

```ts
function toLoanStatusVariant(status: number): StatusVariant {
  switch(status) {
    case 1: return "active";
    case 2: return "completed";
    case 3: return "failed";
    default: return "info";
  }
}
```

---

## Accessibility

- Element has `role="status"` and `aria-label` set to the display label.
- The dot span is `aria-hidden="true"`.

---

## Dependencies

- React 18
- No external packages
