# useMap

A reactive ES6 `Map` wrapper that triggers re-renders on mutations.

## Import

```ts
import { useMap } from "@/hooks/useMap";
```

## Signature

```ts
function useMap<K, V>(initial?: Iterable<readonly [K, V]>): {
  map: Map<K, V>;
  set: (key: K, value: V) => void;
  delete: (key: K) => void;
  get: (key: K) => V | undefined;
  has: (key: K) => boolean;
  clear: () => void;
  reset: () => void;
  size: number;
}
```

## Parameters

| Parameter | Type                        | Default | Description                         |
| --------- | --------------------------- | ------- | ----------------------------------- |
| `initial` | `Iterable<readonly [K, V]>` | `[]`    | Initial key-value pairs             |

## Return Value

| Member    | Type                          | Description                             |
| --------- | ----------------------------- | --------------------------------------- |
| `map`     | `Map<K, V>`                   | Underlying `Map` instance               |
| `set`     | `(k: K, v: V) => void`        | Inserts or updates `k → v`             |
| `delete`  | `(k: K) => void`              | Removes entry for `k`                   |
| `get`     | `(k: K) => V \| undefined`    | Returns the value for `k`              |
| `has`     | `(k: K) => boolean`           | Returns `true` if `k` exists           |
| `clear`   | `() => void`                  | Empties the map                         |
| `reset`   | `() => void`                  | Restores `initial` entries             |
| `size`    | `number`                      | Current number of entries               |

## Example

```tsx
import { useMap } from "@/hooks/useMap";

function VoteTracker({ voters }: { voters: string[] }) {
  const { set, get, size } = useMap<string, "yes" | "no">();
  return (
    <ul>
      {voters.map((v) => (
        <li key={v}>
          {v}: {get(v) ?? "pending"}
          <button onClick={() => set(v, "yes")}>Yes</button>
          <button onClick={() => set(v, "no")}>No</button>
        </li>
      ))}
      <li>Votes cast: {size}</li>
    </ul>
  );
}
```
