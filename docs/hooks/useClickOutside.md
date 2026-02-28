# useClickOutside

Calls a handler function whenever the user clicks outside of a referenced DOM element. Commonly used to close dropdowns, modals, and popovers.

## Import

```ts
import { useClickOutside } from "@/hooks/useClickOutside";
```

## Signature

```ts
function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled?: boolean
): React.RefObject<T>
```

## Parameters

| Parameter | Type         | Default | Description                                            |
| --------- | ------------ | ------- | ------------------------------------------------------ |
| `handler` | `() => void` | —       | Callback invoked when a click outside is detected      |
| `enabled` | `boolean`    | `true`  | Pass `false` to temporarily disable the listener       |

## Return Value

A `RefObject<T>` to attach to the container element.

## Example

```tsx
import { useRef } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

function Dropdown({ onClose }: { onClose: () => void }) {
  const ref = useClickOutside<HTMLDivElement>(onClose);
  return <div ref={ref}>Dropdown content</div>;
}
```

## Notes

- Attaches a `mousedown` listener to `document`.
- The listener is removed when the component unmounts or `enabled` becomes `false`.
