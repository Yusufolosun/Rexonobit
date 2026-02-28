import React from "react";

export type StatusVariant =
  | "active"
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "locked"
  | "open"
  | "paused"
  | "warning"
  | "info";

const VARIANT_STYLES: Record<StatusVariant, React.CSSProperties> = {
  active:    { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" },
  pending:   { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" },
  completed: { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" },
  failed:    { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" },
  cancelled: { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" },
  locked:    { background: "#f3e8ff", color: "#7e22ce", border: "1px solid #e9d5ff" },
  open:      { background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" },
  paused:    { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" },
  warning:   { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
  info:      { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" },
};

interface StatusChipProps {
  /** Visual variant controlling color scheme. */
  variant: StatusVariant;
  /** Label text displayed in the chip. Defaults to the variant name. */
  label?: string;
  /** Whether to show a small dot indicator before the label. */
  dot?: boolean;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * StatusChip
 *
 * Small colored chip for representing entity status — loan state, circle
 * status, task state, etc. Each variant has a distinct color scheme.
 *
 * @example
 * <StatusChip variant="active" />
 * <StatusChip variant="pending" label="Awaiting payout" dot />
 */
const StatusChip: React.FC<StatusChipProps> = ({
  variant,
  label,
  dot = false,
  className = "",
}) => {
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.info;
  const displayLabel = label ?? variant.charAt(0).toUpperCase() + variant.slice(1);

  return (
    <span
      role="status"
      aria-label={displayLabel}
      className={`status-chip status-chip--${variant} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.2rem 0.6rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
        ...styles,
      }}
    >
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "currentColor",
            flexShrink: 0,
          }}
        />
      )}
      {displayLabel}
    </span>
  );
};

export default StatusChip;
