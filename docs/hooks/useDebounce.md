# useDebounce

**File:** `frontend/src/hooks/useDebounce.ts`

## Purpose

Generic debounce hook. Delays updating a value until a specified quiet period has elapsed without a new value being provided. Reduces unnecessary re-renders and API calls triggered by rapid input changes.

## Signature

```ts
function useDebounce<T>(value: T, delayMs?: number): T
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `T` | — | The value to debounce |
| `delayMs` | `number` | `300` | Quiet period in milliseconds |

## Returns

The debounced value of type `T`. Updates after `delayMs` ms of inactivity.

## Example

```tsx
const [query, setQuery] = useState("");
const debouncedQuery = useDebounce(query, 400);

useEffect(() => {
  if (debouncedQuery) searchMembers(debouncedQuery);
}, [debouncedQuery]);
```

## Notes

- Internally uses `setTimeout` with cleanup on each value change.
- Works with any type `T` — strings, numbers, objects.
- No external dependencies.
