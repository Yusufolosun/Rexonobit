# AlertBanner

**Location:** `frontend/src/components/AlertBanner.tsx`

Full-width inline alert banner for status messages, warnings, and errors. Supports four colour variants, an optional title, and dismissal.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"info" \| "success" \| "warning" \| "error"` | `"info"` | Visual treatment |
| `title` | `string` | — | Optional heading inside the banner |
| `message` | `React.ReactNode` | *(required)* | Body content — string or JSX |
| `dismissible` | `boolean` | `false` | Show a dismiss button |
| `onDismiss` | `() => void` | — | Called when dismiss is clicked |
| `className` | `string` | `""` | Extra CSS class |

---

## Usage

```tsx
import AlertBanner from "@/components/AlertBanner";

// Static info banner
<AlertBanner
  variant="info"
  title="Testnet Only"
  message="Some features are unavailable on mainnet."
/>

// Dismissible error with parsed message
const [error, setError] = useState<string | null>(null);
{error && (
  <AlertBanner
    variant="error"
    message={error}
    dismissible
    onDismiss={() => setError(null)}
  />
)}

// Success confirmation
<AlertBanner
  variant="success"
  message={<>Transaction submitted: <code>{txId}</code></>}
/>
```

---

## Variants

| Variant | Background | Use Case |
|---------|-----------|----------|
| `info` | Indigo tint | Tips, informational notices |
| `success` | Green tint | Confirmation, successful actions |
| `warning` | Yellow tint | Degraded state, testnet warnings |
| `error` | Red tint | Errors, failed transactions |

---

## Accessibility

- `role="alert"` triggers live-region announcement.
- Icon is `aria-hidden`.
- Dismiss button has `aria-label="Dismiss alert"`.
