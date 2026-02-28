# ConnectionStatus

**Location:** `frontend/src/components/ConnectionStatus.tsx`

Renders a red offline warning banner when the browser loses internet connectivity. Uses `useNetworkStatus` internally and renders nothing when online.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `offlineMessage` | `string` | `"You are offline. Blockchain data may be stale."` | Custom offline message |
| `className` | `string` | `""` | Extra CSS class |

---

## Usage

```tsx
import ConnectionStatus from "@/components/ConnectionStatus";

// Place at the top of your layout
function Layout({ children }) {
  return (
    <>
      <ConnectionStatus />
      <main>{children}</main>
    </>
  );
}

// Custom message
<ConnectionStatus offlineMessage="No connection — wallet interactions disabled." />
```

---

## Behaviour

- **Online**: renders `null` (no DOM output).
- **Offline**: shows a red/pink alert banner with `role="status"` and `aria-live="polite"`.
- Reacts live to online/offline browser events without page refresh.

---

## Dependencies

- `useNetworkStatus` — connectivity detection hook
