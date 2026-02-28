# useKeyPress

Returns `true` while a specific keyboard key is held down, and `false` once it is released.

## Import

```ts
import { useKeyPress } from "@/hooks/useKeyPress";
```

## Signature

```ts
function useKeyPress(targetKey: string): boolean
```

## Parameters

| Parameter   | Type     | Description                                   |
| ----------- | -------- | --------------------------------------------- |
| `targetKey` | `string` | Key value as defined by `KeyboardEvent.key`   |

## Return Value

`boolean` — `true` while the key is pressed, `false` otherwise.

## Example

```tsx
import { useKeyPress } from "@/hooks/useKeyPress";

function ShortcutHint() {
  const shiftPressed = useKeyPress("Shift");
  return <p>Shift is {shiftPressed ? "held" : "not held"}</p>;
}
```

## Common Key Values

| Key       | `event.key` value |
| --------- | ----------------- |
| Enter     | `"Enter"`         |
| Escape    | `"Escape"`        |
| Spacebar  | `" "`             |
| Arrow Up  | `"ArrowUp"`       |

## Notes

- Attaches `keydown` and `keyup` listeners to `window`.
- Listeners are removed automatically on unmount.
