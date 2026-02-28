# useAsyncCallback

Wraps any async function and tracks its `loading` and `error` state. Safe to invoke after component unmount — state updates are skipped automatically.

## Import

```ts
import { useAsyncCallback } from "@/hooks/useAsyncCallback";
```

## Signature

```ts
function useAsyncCallback<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>
): {
  execute: (...args: Args) => Promise<R | undefined>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}
```

## Parameters

| Parameter | Type                              | Description                          |
| --------- | --------------------------------- | ------------------------------------ |
| `fn`      | `(...args: Args) => Promise<R>`   | The async function to wrap           |

## Return Value

| Member       | Type                                     | Description                                        |
| ------------ | ---------------------------------------- | -------------------------------------------------- |
| `execute`    | `(...args: Args) => Promise<R \| undefined>` | Callable wrapper; clears error before each run |
| `loading`    | `boolean`                                | `true` while the async function is running        |
| `error`      | `string \| null`                         | Caught error message, or `null`                   |
| `clearError` | `() => void`                             | Manually clears the error state                   |

## Example

```tsx
import { useAsyncCallback } from "@/hooks/useAsyncCallback";
import { doContractCall } from "@stacks/connect";

function FundButton() {
  const { execute: fund, loading, error } = useAsyncCallback(
    async (amount: number) => {
      await doContractCall({ ... });
    }
  );

  return (
    <>
      {error && <p className="error">{error}</p>}
      <button onClick={() => fund(100)} disabled={loading} aria-busy={loading}>
        {loading ? "Funding…" : "Fund Pool"}
      </button>
    </>
  );
}
```

## Notes

- `fn` is stored in a ref so the latest version is always used without recreating `execute`.
- Unmount safety: if the component unmounts while `fn` is still running, `setLoading`/`setError` are not called.
- Returns `undefined` (not throws) when `fn` rejects; the rejection is captured in `error`.
