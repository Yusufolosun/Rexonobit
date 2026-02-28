# ErrorAlert

A standardised inline error alert displayed within panels. Renders `null` when no error is present, so it is safe to always mount.

## Import

```tsx
import { ErrorAlert } from "@/components/ErrorAlert";
```

## Props

| Prop        | Type                    | Required | Description                                           |
| ----------- | ----------------------- | -------- | ----------------------------------------------------- |
| `error`     | `string \| null \| undefined` | Yes | Error message to display. `null`/`undefined` = hidden |
| `onDismiss` | `() => void`            | No       | Renders an × dismiss button when provided             |

## Error Classification

Internally classifies the error string into categories:

| Category    | Trigger keywords                   | Hint displayed               |
| ----------- | ---------------------------------- | ----------------------------- |
| Network     | `fetch`, `network`, `failed to fetch` | Check your internet connection |
| Contract    | Any `(err uXXX)` pattern           | Parsed error code message     |
| Generic     | Any other string                   | Raw message shown             |

## Accessibility

- Uses `role="alert"` so screen readers announce the error immediately.
- Close button has `aria-label="Dismiss error"`.

## Example

```tsx
import { ErrorAlert } from "@/components/ErrorAlert";
import { useError } from "@/hooks/useError";

function LoanForm() {
  const { error, clearError, wrapAsync } = useError();

  return (
    <>
      <ErrorAlert error={error} onDismiss={clearError} />
      <button onClick={() => wrapAsync(submitLoan)}>Submit</button>
    </>
  );
}
```

## Notes

- Designed to be paired with `useError` or `useAsyncCallback` for automatic error capture.
- Use `parseContractError` from `lib/parseError` before passing Clarity error strings to ensure human-readable messages.
