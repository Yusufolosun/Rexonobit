# useMediaQuery

**File:** `frontend/src/hooks/useMediaQuery.ts`

## Purpose

Reactive CSS media query hook. Returns `true` when the provided media query matches, and updates automatically when the viewport or user preferences change. Enables responsive behaviour without CSS class toggling.

## Signature

```ts
function useMediaQuery(query: string): boolean
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | `string` | A CSS media query string |

## Returns

`boolean` — `true` while the query matches.

## Common Queries

| Use Case | Query |
|----------|-------|
| Mobile viewport | `"(max-width: 768px)"` |
| Dark mode preference | `"(prefers-color-scheme: dark)"` |
| Reduced motion | `"(prefers-reduced-motion: reduce)"` |
| Tablet | `"(min-width: 769px) and (max-width: 1024px)"` |

## Example

```tsx
const isMobile = useMediaQuery("(max-width: 768px)");
return isMobile ? <MobileNav /> : <DesktopNav />;
```

## Notes

- SSR-safe: returns `false` when `window` is undefined.
- Handles both modern (`addEventListener`) and legacy (`addListener`) APIs.
- Cleans up listeners on unmount.
