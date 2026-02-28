# useFetch

Fetches a JSON endpoint and manages `data`, `loading`, and `error` state with automatic abort on unmount or URL change.

## Import

```ts
import { useFetch } from "@/hooks/useFetch";
```

## Signature

```ts
function useFetch<T = unknown>(
  url: string | null,
  options?: RequestInit
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
```

## Parameters

| Parameter | Type              | Description                                                |
| --------- | ----------------- | ---------------------------------------------------------- |
| `url`     | `string \| null`  | Endpoint URL. Pass `null` or `""` to skip the request     |
| `options` | `RequestInit`     | Optional `fetch()` options (headers, method, body, etc.)  |

## Return Value

| Property  | Type         | Description                                         |
| --------- | ------------ | --------------------------------------------------- |
| `data`    | `T \| null`  | Parsed JSON response, or `null` before first load   |
| `loading` | `boolean`    | `true` while the request is in progress             |
| `error`   | `string \| null` | Error message, or `null` when successful        |
| `refetch` | `() => void` | Manually re-triggers the fetch                      |

## Example

```tsx
import { useFetch } from "@/hooks/useFetch";
import { STACKS_API } from "@/lib/constants";

function AccountBalance({ address }: { address: string }) {
  const { data, loading, error } = useFetch<{ balance: string }>(
    `${STACKS_API}/v2/accounts/${address}`
  );

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;
  return <p>Balance: {data?.balance ?? "N/A"}</p>;
}
```

## Notes

- Uses `AbortController` to cancel the in-flight request when `url` changes or the component unmounts.
- Non-OK HTTP responses (status ≥ 400) are thrown as `"HTTP {status}: {statusText}"` errors.
- `AbortError` is silently swallowed (not exposed as `error`).
