# useWindowFocus

**File:** `frontend/src/hooks/useWindowFocus.ts`

## Purpose

Registers a `visibilitychange` event listener that fires a callback whenever the browser tab becomes visible again. Used across all data panels to refresh on-chain state when the user returns to the app.

## Signature

```ts
function useWindowFocus(onFocus: () => void): void
```

## Parameters

| Param | Type | Description |
|-------|------|-------------|
| `onFocus` | `() => void` | Callback invoked when the tab becomes visible |

## Behaviour

- Attaches a listener to `document.visibilitychange`.
- Fires `onFocus` when `document.visibilityState === "visible"`.
- Cleans up the listener on unmount.

## Example

```tsx
const refresh = useCallback(async () => { /* fetch data */ }, [address]);

useEffect(() => { refresh(); }, [refresh]);
useWindowFocus(refresh); // re-fetch on tab focus
```

## Notes

- The callback should be stable (wrapped in `useCallback`) to avoid resetting the listener on every render.
- Used in every data panel: `VaultPanel`, `LoanPanel`, `RoscaPanel`, `TaskBoard`, `TreasuryPanel`, `GovernancePanel`, `ArbitrationPanel`, `SCreditPanel`, and `ProtocolStats`.
