# useContractError

**File:** `frontend/src/hooks/useContractError.ts`

## Purpose

Centralised error state management for contract interactions. Extracts human-readable messages from caught Clarity errors, network errors, and plain strings. Supports automatic error dismissal after a configurable timeout.

## Signature

```ts
function useContractError(autoClearMs?: number): UseContractErrorResult
```

## Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `autoClearMs` | `number` | `6000` | Milliseconds before error auto-dismisses |

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `error` | `string \| null` | Current error message, or null |
| `setError` | `(msg: string) => void` | Manually set error (resets auto-dismiss timer) |
| `clearError` | `() => void` | Immediately clear the error |
| `wrap` | `<T>(fn, onSuccess?) => Promise<T \| null>` | Wraps an async call; sets error on failure |

## `wrap` Behaviour

1. Calls `fn()`.
2. On success: calls `clearError()`, calls optional `onSuccess(result)`, returns result.
3. On failure: calls `setError(extractMessage(err))`, returns `null`.

## Error Classification

The `setError` path does not classify — classification is done by `ErrorAlert` component.

## Example

```tsx
const { error, clearError, setError } = useContractError();

const handleDeposit = async () => {
  setTxPending(true);
  try {
    const res = await deposit(amount);
    clearError();
    toastSuccess("Deposited", res.txid);
  } catch (e) {
    setError(String(e));
  } finally {
    setTxPending(false);
  }
};

<ErrorAlert error={error} onDismiss={clearError} />
```

## Notes

- Typically used alongside `ErrorAlert` for display.
- The `wrap` helper is a concise alternative to the try/catch pattern shown above.
