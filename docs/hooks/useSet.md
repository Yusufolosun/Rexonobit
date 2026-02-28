# useSet

A reactive ES6 `Set` wrapper that triggers re-renders on mutations.

## Import

```ts
import { useSet } from "@/hooks/useSet";
```

## Signature

```ts
function useSet<T>(initial?: Iterable<T>): {
  set: Set<T>;
  add: (value: T) => void;
  remove: (value: T) => void;
  toggle: (value: T) => void;
  has: (value: T) => boolean;
  clear: () => void;
  reset: () => void;
  size: number;
}
```

## Parameters

| Parameter | Type           | Default  | Description                            |
| --------- | -------------- | -------- | -------------------------------------- |
| `initial` | `Iterable<T>`  | `[]`     | Initial values to populate the set     |

## Return Value

| Member   | Type               | Description                                              |
| -------- | ------------------ | -------------------------------------------------------- |
| `set`    | `Set<T>`           | The underlying `Set` instance (read-only access)         |
| `add`    | `(v: T) => void`   | Adds `v` if not already present                          |
| `remove` | `(v: T) => void`   | Removes `v`                                              |
| `toggle` | `(v: T) => void`   | Adds `v` if absent, removes if present                   |
| `has`    | `(v: T) => boolean`| Returns `true` if `v` is in the set                     |
| `clear`  | `() => void`       | Empties the set                                          |
| `reset`  | `() => void`       | Restores the set to the `initial` values                 |
| `size`   | `number`           | Current number of elements                               |

## Example

```tsx
import { useSet } from "@/hooks/useSet";

function MemberSelector({ members }: { members: string[] }) {
  const { has, toggle, size } = useSet<string>();
  return (
    <ul>
      {members.map((m) => (
        <li key={m}>
          <button onClick={() => toggle(m)}>
            {has(m) ? "Deselect" : "Select"} {m}
          </button>
        </li>
      ))}
      <li>Selected: {size}</li>
    </ul>
  );
}
```
