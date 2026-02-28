# useTimeout

**Location:** `frontend/src/hooks/useTimeout.ts`

Schedules a one-shot callback after a given delay. Automatically clears the timer on unmount. Provides `set()` and `clear()` to control the timer imperatively.

---

## Signature

```ts
function useTimeout(
  callback: () => void,
  delay: number
): { set: () => void; clear: () => void }
```

---

## Parameters

| Param | Type | Description |
|-------|------|-------------|
| `callback` | `() => void` | Function to call after the delay |
| `delay` | `number` (ms) | Timeout delay in milliseconds |

---

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `set` | `() => void` | Start (or restart) the timer |
| `clear` | `() => void` | Cancel the pending timer |

---

## Usage

```tsx
import { useTimeout } from "@/hooks/useTimeout";
import { useEffect } from "react";

// Auto-dismiss a success banner after 4 seconds
function SuccessBanner({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  const { set } = useTimeout(() => setVisible(false), 4000);

  useEffect(() => { set(); }, [set]);

  if (!visible) return null;
  return <div className="badge-success">{message}</div>;
}
```

### Debounced action (re-set on each trigger)

```tsx
const { set: scheduleRead } = useTimeout(markAsRead, 2000);

<div onMouseEnter={scheduleRead} onMouseLeave={clear}>
  {notification.message}
</div>
```

---

## Notes

- Calling `set()` while a timer is already running **cancels the previous timer** and starts fresh.
- Stale-closure on `callback` is handled via an internal ref — you can safely reference component state inside the callback.
- Timer is cleared automatically on component unmount.

---

## Dependencies

- React 18 (`useCallback`, `useEffect`, `useRef`)
- No external packages
