# SkeletonCard

A placeholder loading skeleton that mimics a card layout while content is being fetched. Reduces perceived load time by showing animated pulse bars.

## Import

```tsx
import { SkeletonCard } from "@/components/SkeletonCard";
```

## Props

| Prop     | Type     | Default | Description                                  |
| -------- | -------- | ------- | -------------------------------------------- |
| `lines`  | `number` | `3`     | Number of animated horizontal bars to show  |
| `height` | `string` | `"auto"`| CSS height of the overall skeleton container|

## Example

```tsx
{loading ? (
  <SkeletonCard lines={4} height="160px" />
) : (
  <ActualContent />
)}
```

## Accessibility

- The container has `aria-busy="true"` and `aria-label="Loading content"` so screen readers announce the loading state.
- Each bar is `aria-hidden="true"` to avoid noise.

## CSS Class

The animated bars use `.skeleton-pulse` (defined in `index.css`), which applies a shimmer `@keyframes` animation via `background-position` transition.

## Notes

- `height` is applied to the wrapper `div`; individual bars have a fixed height of `12px`.
- Use in combination with actual content wrapped in a conditional: `loading ? <SkeletonCard /> : <Content />`.
