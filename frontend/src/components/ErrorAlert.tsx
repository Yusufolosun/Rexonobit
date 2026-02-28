// frontend/src/components/ErrorAlert.tsx
// Standardised inline error alert component used across all panels

/**
 * ErrorAlert — normalised error display.
 * Accepts an `error` string | null from hook state and renders a styled
 * dismissible alert. Returns null when no error is present.
 *
 * @example
 * ```tsx
 * <ErrorAlert error={error} onDismiss={() => clearError()} />
 * ```
 */

// No default React import needed — JSX transform handles it

interface ErrorAlertProps {
  /** Error message to display. Pass null or undefined to render nothing. */
  error: string | null | undefined;
  /** Optional dismiss callback. Renders an × button when provided. */
  onDismiss?: () => void;
}

/**
 * Classifies an error string into user-facing category labels.
 * Network errors show a connection hint; contract errors show the code.
 */
function classifyError(msg: string): { label: string; hint: string } {
  const lower = msg.toLowerCase();
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("failed to fetch")) {
    return { label: "Network error", hint: "Check your connection and try again." };
  }
  if (lower.includes("err_not_member") || lower.includes("u400")) {
    return { label: "Not a member", hint: "Register as a member before using this feature." };
  }
  if (lower.includes("err_insufficient") || lower.includes("u303") || lower.includes("u402")) {
    return { label: "Insufficient balance", hint: "Deposit more STX and retry." };
  }
  if (lower.includes("err_unauthorized") || lower.includes("u401")) {
    return { label: "Unauthorized", hint: "You don't have permission for this action." };
  }
  if (lower.includes("err_not_found") || lower.includes("u407")) {
    return { label: "Not found", hint: "The requested record does not exist." };
  }
  return { label: "Error", hint: msg };
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) return null;
  const { label, hint } = classifyError(error);
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.3)",
        color: "var(--color-error, #ef4444)",
        fontSize: "0.85rem",
        marginBottom: "0.75rem",
      }}
    >
      <span style={{ flex: 1 }}>
        <strong>{label}:</strong> {hint}
      </span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            fontSize: "1rem",
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default ErrorAlert;
