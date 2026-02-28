# useInterval

**File:** `frontend/src/hooks/useInterval.ts`

## Purpose

Declarative `setInterval` hook. Runs a callback on a fixed delay without needing to manage `setInterval`/`clearInterval` directly. Pass `null` as `delayMs` to pause polling — useful for pausing background refreshes while the tab is hidden.

## Signature

```ts
function useInterval(callback: () => void, delayMs: number | null): void
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `() => void` | Function called on each tick |
| `delayMs` | `number \| null` | Interval in ms. Pass `null` to pause |

## Returns

`void` — manages the interval internally.

## Example

```tsx
// Refresh every 30 seconds, pause when tab is not visible
const isVisible = useWindowFocus();
useInterval(refreshStats, isVisible ? 30_000 : null);
```

## Notes

- The `callback` reference is captured via a `useRef` — the interval does not restart when the callback changes, preventing unnecessary timer resets.
- The interval restarts only when `delayMs` changes.
- Complements `useWindowFocus` — pair them to avoid polling in background tabs.
