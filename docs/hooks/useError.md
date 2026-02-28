# useError

Manages a single error string with helpers to set, clear, and wrap async operations.

## Import

```ts
import { useError } from "@/hooks/useError";
```

## Signature

```ts
function useError(): {
  error: string | null;
  hasError: boolean;
  setError: (message: string) => void;
  clearError: () => void;
  wrapAsync: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}
```

## Return Value

| Member       | Type                                         | Description                                              |
| ------------ | -------------------------------------------- | -------------------------------------------------------- |
| `error`      | `string \| null`                             | Current error message, or `null`                        |
| `hasError`   | `boolean`                                    | Shorthand: `error !== null`                              |
| `setError`   | `(msg: string) => void`                      | Stores an error string                                   |
| `clearError` | `() => void`                                 | Clears the current error                                 |
| `wrapAsync`  | `<T>(fn: () => Promise<T>) => Promise<T \| undefined>` | Runs `fn`, captures thrown errors as the error string, clears previous error beforehand |

## Example

```tsx
import { useError } from "@/hooks/useError";

function SubmitForm() {
  const { error, wrapAsync } = useError();

  const handleSubmit = () =>
    wrapAsync(async () => {
      await submitToChain();
    });

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

## Notes

- `wrapAsync` returns `undefined` (not a thrown error) when the wrapped function throws.
- Pair with `useAsyncCallback` when you also need `loading` state.
