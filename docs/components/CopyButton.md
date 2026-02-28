# CopyButton

**Location:** `frontend/src/components/CopyButton.tsx`

A button that copies a text value to the clipboard and briefly shows a confirmation label. Integrates `useCopyToClipboard` and `useTimeout` for safe cross-browser clipboard access.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | *(required)* | Text to copy |
| `label` | `string` | `"Copy"` | Idle button label |
| `successLabel` | `string` | `"Copied!"` | Label after successful copy |
| `resetAfter` | `number` (ms) | `2000` | Duration to display `successLabel` |
| `className` | `string` | `""` | Extra CSS class names |
| `ariaLabel` | `string` | Auto | Override for `aria-label` |

---

## Usage

```tsx
import CopyButton from "@/components/CopyButton";

// Copy wallet address
<CopyButton value={address} label="Copy address" />

// Copy with custom labels
<CopyButton
  value={txid}
  label="Copy TX ID"
  successLabel="Copied ✓"
  resetAfter={3000}
/>

// Compact inline usage
<span>{truncateAddress(address)}</span>
<CopyButton value={address} />
```

---

## Visual States

| State | Background | Text color | Icon |
|-------|-----------|-----------|------|
| Idle | `var(--bg)` | `var(--text-primary)` | `⎘` |
| Copied | `var(--success-bg)` | `var(--success-fg)` | `✓` |

---

## Accessibility

- `aria-label` defaults to `"{label}: {value}"` (e.g., `"Copy: ST1P…PGZGM"`).
- Icon span is `aria-hidden="true"`.

---

## CSS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--success-bg` | `#dcfce7` | Success state background |
| `--success-fg` | `#15803d` | Success state text color |

---

## Dependencies

- `useCopyToClipboard` — clipboard API wrapper
- `useTimeout` — auto-resets success state
- React 18
