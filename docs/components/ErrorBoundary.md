# ErrorBoundary

A React class-based error boundary that prevents unhandled render errors from crashing the entire application. Displays an accessible fallback UI with a "Try again" button.

## Import

```tsx
import ErrorBoundary from "@/components/ErrorBoundary";
// or named:
import { ErrorBoundary } from "@/components/ErrorBoundary";
```

## Props

| Prop       | Type                                                | Required | Description                                                   |
| ---------- | --------------------------------------------------- | -------- | ------------------------------------------------------------- |
| `children` | `ReactNode`                                         | Yes      | Content to protect                                            |
| `fallback` | `(error: Error, reset: () => void) => ReactNode`    | No       | Custom fallback UI; receives `error` and `reset` callback     |
| `onError`  | `(error: Error, info: ErrorInfo) => void`           | No       | Callback for error reporting (e.g. logging to Sentry)         |

## Default Fallback

When no `fallback` prop is provided, renders a card with:
- ⚠️ warning icon
- Error message in red
- "Try again" button that resets the boundary

## Accessibility

- Fallback container has `role="alert"` and `aria-live="assertive"`.
- Warning icon is `aria-hidden="true"`.
- "Try again" button has `aria-label="Retry loading this section"`.

## Example

```tsx
import ErrorBoundary from "@/components/ErrorBoundary";

// Basic usage
<ErrorBoundary>
  <VaultPanel />
</ErrorBoundary>

// Custom fallback
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Load failed: {error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )}
  onError={(err) => logger.capture(err)}
>
  <GovernancePanel />
</ErrorBoundary>
```

## Notes

- Must be a class component (React error boundaries require `getDerivedStateFromError` / `componentDidCatch`).
- Does **not** catch errors in event handlers or async code — use `useAsyncCallback` or `useError` for those.
- `reset()` re-mounts children by clearing `hasError` state; this re-runs the failed render.
