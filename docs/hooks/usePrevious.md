# usePrevious

**File:** `frontend/src/hooks/usePrevious.ts`

## Purpose

Returns the value of a variable from the previous render cycle. Useful for detecting value transitions and triggering effects only when a value changes in a specific direction (e.g. balance increase → success toast).

## Signature

```ts
function usePrevious<T>(value: T): T | undefined
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `T` | The value to track |

## Returns

`T | undefined` — The value from the previous render. `undefined` on the first render.

## Example

```tsx
const prevBalance = usePrevious(balance);

useEffect(() => {
  if (prevBalance !== undefined && balance > prevBalance) {
    toast.success(`Balance increased by ${balance - prevBalance} microSTX`);
  }
}, [balance, prevBalance]);
```

## Notes

- The update to the ref happens inside a `useEffect`, so the returned value always reflects the *previous* render's value.
- Returns `undefined` (not `initialValue`) on mount — check for `undefined` before comparing.
