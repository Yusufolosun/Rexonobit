# useScrollPosition

**Location:** `frontend/src/hooks/useScrollPosition.ts`

Tracks window scroll position, whether the page has passed a threshold, and the current scroll direction. Low-overhead: uses a passive `scroll` event listener.

---

## Signature

```ts
function useScrollPosition(options?: UseScrollPositionOptions): ScrollPosition
```

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` (px) | `10` | Vertical pixels before `isScrolled` becomes `true` |
| `directionDelta` | `number` (px) | `5` | Min delta to register a direction change |

---

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `x` | `number` | Horizontal scroll offset (px) |
| `y` | `number` | Vertical scroll offset (px) |
| `isScrolled` | `boolean` | `true` when `y > threshold` |
| `direction` | `"up" \| "down" \| null` | Scroll direction (null until first scroll) |

---

## Usage

### Sticky navbar that hides on scroll-down

```tsx
import { useScrollPosition } from "@/hooks/useScrollPosition";

function Navbar() {
  const { isScrolled, direction } = useScrollPosition({ threshold: 80 });
  const hidden = direction === "down" && isScrolled;

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.25s ease",
        background: isScrolled ? "var(--card-bg)" : "transparent",
        boxShadow: isScrolled ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
      }}
    >
      …
    </nav>
  );
}
```

### Back-to-top button

```tsx
const { y } = useScrollPosition({ threshold: 400 });
{y > 400 && <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Top</button>}
```

---

## Notes

- The listener is registered with `{ passive: true }` for optimal performance.
- Initial values are `{ x: 0, y: 0, isScrolled: false, direction: null }` on server-side or before first scroll.

---

## Dependencies

- React 18 (`useEffect`, `useState`)
- No external packages
