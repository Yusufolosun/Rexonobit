# useQueue

A reactive FIFO queue backed by an array. Triggers re-renders on every mutation.

## Import

```ts
import { useQueue } from "@/hooks/useQueue";
```

## Signature

```ts
function useQueue<T>(initial?: T[]): {
  queue: T[];
  enqueue: (item: T) => void;
  dequeue: () => T | undefined;
  peek: () => T | undefined;
  clear: () => void;
  isEmpty: boolean;
  size: number;
}
```

## Parameters

| Parameter | Type  | Default | Description                           |
| --------- | ----- | ------- | ------------------------------------- |
| `initial` | `T[]` | `[]`    | Initial items in queue order (FIFO)   |

## Return Value

| Member    | Type                  | Description                               |
| --------- | --------------------- | ----------------------------------------- |
| `queue`   | `T[]`                 | Snapshot of the current queue             |
| `enqueue` | `(item: T) => void`   | Adds `item` to the back                   |
| `dequeue` | `() => T \| undefined`| Removes and returns the front item        |
| `peek`    | `() => T \| undefined`| Returns the front item without removing   |
| `clear`   | `() => void`          | Empties the queue                         |
| `isEmpty` | `boolean`             | `true` when the queue has no items        |
| `size`    | `number`              | Current number of items                   |

## Example

```tsx
import { useQueue } from "@/hooks/useQueue";

function TxQueue() {
  const { queue, enqueue, dequeue, isEmpty } = useQueue<string>();
  return (
    <div>
      <button onClick={() => enqueue(`tx-${Date.now()}`)}>Add Tx</button>
      <button onClick={dequeue} disabled={isEmpty}>Process Next</button>
      <ul>
        {queue.map((tx) => <li key={tx}>{tx}</li>)}
      </ul>
    </div>
  );
}
```

## Notes

- `dequeue()` returns `undefined` when the queue is empty.
- `peek()` never mutates state.
