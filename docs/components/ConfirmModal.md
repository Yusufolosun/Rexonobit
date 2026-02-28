# ConfirmModal

**Location:** `frontend/src/components/ConfirmModal.tsx`

Accessible confirmation dialog built with `role="dialog"` and `aria-modal`. Focuses the cancel button on open, closes on Escape key, and closes when clicking the backdrop.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | *(required)* | Controls visibility |
| `title` | `string` | *(required)* | Dialog heading |
| `message` | `React.ReactNode` | *(required)* | Body content — string or JSX |
| `confirmLabel` | `string` | `"Confirm"` | Confirm button text |
| `cancelLabel` | `string` | `"Cancel"` | Cancel button text |
| `confirmVariant` | `"danger" \| "primary" \| "warning"` | `"primary"` | Button colour treatment |
| `onConfirm` | `() => void` | *(required)* | Called on confirmation |
| `onCancel` | `() => void` | *(required)* | Called on cancel or dismiss |
| `isLoading` | `boolean` | `false` | Disables buttons and shows loading state |

---

## Usage

```tsx
import ConfirmModal from "@/components/ConfirmModal";

<ConfirmModal
  isOpen={showConfirm}
  title="Withdraw All Funds?"
  message="This will withdraw your entire vault balance. This action cannot be undone."
  confirmLabel="Withdraw"
  confirmVariant="danger"
  onConfirm={handleWithdraw}
  onCancel={() => setShowConfirm(false)}
  isLoading={isWithdrawing}
/>
```

---

## Accessibility

- `role="dialog"` + `aria-modal="true"` for screen reader virtual-cursor trapping
- `aria-labelledby` points to the modal `<h2>` title
- `aria-describedby` points to the modal body
- Cancel button receives focus on open
- Escape key triggers `onCancel`
- Backdrop click triggers `onCancel`
- `aria-busy` set on confirm button while `isLoading`
