# useNetworkStatus

**Location:** `frontend/src/hooks/useNetworkStatus.ts`

Tracks browser network connectivity. Returns live online/offline state plus optional Network Information API data (effective connection type, downlink, RTT).

---

## Return Value

```ts
interface NetworkStatus {
  isOnline: boolean;        // navigator.onLine
  isOffline: boolean;       // !isOnline
  effectiveType: string | undefined;  // "4g" | "3g" | "2g" | "slow-2g"
  downlink: number | undefined;       // estimated Mbps
  rtt: number | undefined;            // latency hint in ms
}
```

---

## Usage

```tsx
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function App() {
  const { isOnline, effectiveType } = useNetworkStatus();

  if (!isOnline) {
    return <div className="text-danger">You are offline. Please reconnect.</div>;
  }

  return (
    <div>
      <span>Connection: {effectiveType ?? "unknown"}</span>
    </div>
  );
}
```

---

## Behavior

| Event | Effect |
|-------|--------|
| Browser goes offline | `isOnline → false`, `isOffline → true` |
| Browser comes back online | `isOnline → true`, `isOffline → false` |
| Connection type changes | `effectiveType`, `downlink`, `rtt` update |

---

## Notes

- Network Information API is not available in all browsers; `effectiveType`, `downlink`, and `rtt` may be `undefined`.
- `navigator.onLine` may return `true` even when actual connectivity is limited (hotspot with no internet).
- SSR-safe: returns `isOnline: true` when `navigator` is not available.
