# EmptyState

**Location:** `frontend/src/components/EmptyState.tsx`

Displays a centered empty-state UI when a list or panel has no data to show.

---

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | ✓ | — | Primary heading text |
| `icon` | `ReactNode` | | `undefined` | Icon, SVG, or emoji element |
| `message` | `string` | | `undefined` | Supporting text below title |
| `action` | `ReactNode` | | `undefined` | CTA button or link |
| `className` | `string` | | `""` | Extra CSS class names |

---

## Usage

```tsx
import EmptyState from "@/components/EmptyState";

// Minimal
<EmptyState title="No transactions yet" />

// With icon and action
<EmptyState
  icon={<span aria-hidden="true">📭</span>}
  title="No active circles"
  message="Join or create a cooperative circle to get started."
  action={
    <button className="btn-primary" onClick={handleCreate}>
      Create Circle
    </button>
  }
/>
```

---

## Accessibility

- Root element has `role="status"` and `aria-label` set to the `title` value.
- The icon wrapper is decorative; wrap with `aria-hidden="true"` on the inner element if using an SVG.

---

## Styling

Inline layout styles are used for portability. Override with `.empty-state`, `.empty-state__icon`, `.empty-state__title`, `.empty-state__message`, `.empty-state__action` class selectors in your CSS.

---

## Dependencies

- React 18
- No external dependencies
