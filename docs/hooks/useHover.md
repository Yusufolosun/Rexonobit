# useHover

**Location:** `frontend/src/hooks/useHover.ts`

Tracks whether the user's pointer is hovering over a DOM element. Returns a ref to attach to the target and a boolean `isHovered` state.

---

## Signature

```ts
function useHover<T extends HTMLElement = HTMLElement>(): {
  ref: RefObject<T>;
  isHovered: boolean;
}
```

---

## Usage

```tsx
import { useHover } from "@/hooks/useHover";

function TooltipTrigger() {
  const { ref, isHovered } = useHover<HTMLDivElement>();

  return (
    <div ref={ref} className="relative">
      Hover me
      {isHovered && (
        <div className="tooltip">Tooltip content</div>
      )}
    </div>
  );
}
```

---

## Notes

- Attaches `mouseenter` / `mouseleave` listeners to the node. Listener references are stable (memoised with `useCallback`).
- Previous node's listeners are cleaned up when the ref changes.
- For keyboard/focus-visible hover effects, combine with `:focus-visible` CSS or a `useFocusVisible` hook.
