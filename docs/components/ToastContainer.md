# ToastContainer

A fixed-position toast notification stack that displays queued messages from `ToastContext`. Renders in the bottom-right corner of the viewport.

## Import

```tsx
import { ToastContainer } from "@/components/ToastContainer";
```

## Props

No props — reads directly from `ToastContext`.

## Toast Types

| Type      | Icon | Colour variable          |
| --------- | ---- | ------------------------ |
| `success` | ✓    | `--color-success`        |
| `error`   | ✕    | `--color-error`          |
| `warning` | ⚠    | `--color-warning`        |
| `info`    | ℹ    | `--color-accent`         |

## Features

- **Auto-dismiss**: toasts auto-remove after a configurable duration set in `ToastContext`.
- **Manual dismiss**: each toast has a close button (`×`).
- **TX link**: toasts with a `txId` render a "View transaction" link to the Stacks explorer.
- **Stacking**: multiple toasts stack vertically, newest at the bottom.

## Accessibility

- Wrapper has `role="region"` and `aria-label="Notifications"`.
- Individual toasts use `role="alert"` for error/warning and `role="status"` for success/info.

## Placement

Mount once at the application root:

```tsx
// App.tsx
import { ToastContainer } from "@/components/ToastContainer";

function App() {
  return (
    <>
      <Router />
      <ToastContainer />
    </>
  );
}
```

## Dependencies

- `ToastContext` — `toasts`, `removeToast`
- `lib/explorer.explorerTxUrl` — transaction link generation
