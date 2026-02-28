# usePolling

**Location:** `frontend/src/hooks/usePolling.ts`

Repeatedly invokes an async callback at a fixed interval, with controls to start, stop, toggle, and force-run. Cleans up on component unmount and avoids stale-closure issues.

---

## Signature

```ts
function usePolling(
  callback: () => void | Promise<void>,
  options?: UsePollingOptions
): UsePollingReturn
```

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `interval` | `number` (ms) | `15_000` | Time between invocations |
| `immediate` | `boolean` | `true` | Call `callback` immediately on start |
| `enabled` | `boolean` | `true` | Start polling automatically on mount |

---

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `isPolling` | `boolean` | Whether polling is currently active |
| `start` | `() => void` | Start (or restart) polling |
| `stop` | `() => void` | Stop polling |
| `toggle` | `() => void` | Toggle between start and stop |
| `runNow` | `() => void` | Force an immediate call outside the interval |

---

## Usage

```tsx
import { usePolling } from "@/hooks/usePolling";
import { fetchChainTip } from "@/lib/api";

function ChainTipDisplay() {
  const [tip, setTip] = useState<number | null>(null);

  const { isPolling, stop } = usePolling(async () => {
    const data = await fetchChainTip();
    setTip(data.stacks_tip_height);
  }, { interval: 10_000 });

  return (
    <div>
      Block: {tip ?? "—"}
      {isPolling && <LoadingSpinner size="xs" />}
      <button onClick={stop}>Pause</button>
    </div>
  );
}
```

### Conditional polling

```tsx
// Auto-disable when wallet is disconnected
const { address } = useWallet();
usePolling(fetchBalances, { enabled: !!address, interval: 20_000 });
```

---

## Common Intervals

| Use case | Recommended interval |
|----------|---------------------|
| Chain tip display | `10_000` ms |
| Loan due-block countdown | `30_000` ms |
| Circle contribution status | `15_000` ms |
| Trust score refresh | `60_000` ms |

---

## Cleanup

The polling interval is cleared:
- When `stop()` is called
- When `enabled` prop changes to `false`
- On component unmount (via `useEffect` cleanup)

---

## Dependencies

- React 18 (`useCallback`, `useEffect`, `useRef`, `useState`)
- No external packages
