# useIntersectionObserver

**Location:** `frontend/src/hooks/useIntersectionObserver.ts`

Tracks whether a DOM element intersects the viewport (or a custom scroll root) using the native `IntersectionObserver` API. Useful for lazy loading, scroll animations, and infinite scroll triggers.

---

## Signature

```ts
function useIntersectionObserver(options?: IntersectionOptions): IntersectionResult
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number \| number[]` | `0` | Fraction of element visible before firing |
| `root` | `Element \| null` | `null` | Scroll container (null = viewport) |
| `rootMargin` | `string` | `"0px"` | CSS margin around the root |
| `freezeOnceVisible` | `boolean` | `false` | Stop observing after first intersection |

## Return Value

```ts
{
  ref: RefObject<HTMLElement>;     // Attach to target element
  isIntersecting: boolean;         // Currently visible
  entry: IntersectionObserverEntry | null;  // Full entry object
}
```

---

## Usage

```tsx
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

// Lazy-load heavy component
function LazySection() {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
  return (
    <section ref={ref}>
      {isIntersecting ? <HeavyChart /> : <div style={{ height: 300 }} />}
    </section>
  );
}

// One-shot animation trigger
function AnimatedCard() {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.2,
    freezeOnceVisible: true,
  });
  return (
    <div ref={ref} className={isIntersecting ? "fade-in" : "invisible"}>
      Content
    </div>
  );
}

// Infinite scroll sentinel
function InfiniteList() {
  const { ref, isIntersecting } = useIntersectionObserver({ rootMargin: "200px" });
  useEffect(() => {
    if (isIntersecting) loadMore();
  }, [isIntersecting]);
  return <>…items… <div ref={ref} /></>;
}
```

---

## Notes

- Gracefully degrades when `IntersectionObserver` is unavailable (`isIntersecting` stays `false`).
- `freezeOnceVisible: true` disconnects the observer after the first positive intersection, preventing further re-renders.
