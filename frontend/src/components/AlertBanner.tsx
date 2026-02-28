import React from "react";

export type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertBannerProps {
  /** Visual variant controlling colour and icon */
  variant?: AlertVariant;
  /** Banner heading (optional) */
  title?: string;
  /** Banner body message */
  message: React.ReactNode;
  /** Show a dismiss button */
  dismissible?: boolean;
  /** Called when the dismiss button is clicked */
  onDismiss?: () => void;
  /** Extra CSS class on the root element */
  className?: string;
}

const VARIANT_STYLES: Record<AlertVariant, { bg: string; border: string; color: string; icon: string }> = {
  info: {
    bg: "rgba(99,102,241,0.08)",
    border: "rgba(99,102,241,0.3)",
    color: "#4338ca",
    icon: "ℹ",
  },
  success: {
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.3)",
    color: "#15803d",
    icon: "✓",
  },
  warning: {
    bg: "rgba(234,179,8,0.10)",
    border: "rgba(234,179,8,0.35)",
    color: "#92400e",
    icon: "⚠",
  },
  error: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.3)",
    color: "#b91c1c",
    icon: "✕",
  },
};

/**
 * AlertBanner
 *
 * Full-width inline alert for status messages, warnings, and errors.
 * Supports dismissal and optional title.
 *
 * @example
 * <AlertBanner variant="warning" title="Testnet Only" message="This feature is not available on mainnet." />
 * <AlertBanner variant="error" message={parseContractError(err)} dismissible onDismiss={() => setErr(null)} />
 */
export default function AlertBanner({
  variant = "info",
  title,
  message,
  dismissible = false,
  onDismiss,
  className = "",
}: AlertBannerProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      role="alert"
      className={`alert-banner ${className}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.625rem",
        padding: "0.75rem 1rem",
        borderRadius: "var(--radius)",
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.color,
        fontSize: "0.875rem",
        lineHeight: 1.5,
      }}
    >
      {/* Icon */}
      <span
        aria-hidden="true"
        style={{
          fontWeight: 700,
          fontSize: "1rem",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {styles.icon}
      </span>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {title && (
          <p style={{ margin: "0 0 0.2rem", fontWeight: 700 }}>{title}</p>
        )}
        <div style={{ margin: 0 }}>{message}</div>
      </div>

      {/* Dismiss */}
      {dismissible && onDismiss && (
        <button
          aria-label="Dismiss alert"
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            opacity: 0.7,
            padding: "0 0.25rem",
            lineHeight: 1,
            fontSize: "1rem",
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
