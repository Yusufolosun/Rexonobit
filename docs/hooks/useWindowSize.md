# useWindowSize

Tracks the browser window's `innerWidth` and `innerHeight` and re-renders the component whenever the window is resized.

## Import

```ts
import { useWindowSize } from "@/hooks/useWindowSize";
```

## Signature

```ts
function useWindowSize(): { width: number; height: number }
```

## Return Value

| Property | Type     | Description                          |
| -------- | -------- | ------------------------------------ |
| `width`  | `number` | Current `window.innerWidth` in px    |
| `height` | `number` | Current `window.innerHeight` in px   |

## Example

```tsx
import { useWindowSize } from "@/hooks/useWindowSize";

function ResponsivePanel() {
  const { width } = useWindowSize();
  return <p>Viewport width: {width}px</p>;
}
```

## Notes

- Listens to the `resize` event via a debounce-free listener; pair with `useDebounce` if update frequency matters.
- Returns `{ width: 0, height: 0 }` during SSR-like environments where `window` is unavailable.
- The event listener is removed automatically when the component unmounts.
