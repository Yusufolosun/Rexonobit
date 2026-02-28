// No default React import needed — JSX transform handles it;

// ---------------------------------------------------------------------------
// ProgressBar — accessible, reusable progress indicator
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  /** Current value (0 – max) */
  value: number;
  /** Maximum value (defaults to 100) */
  max?: number;
  /** Visible label shown above the bar */
  label?: string;
  /** aria-label used when no visible label is provided */
  ariaLabel?: string;
  /** Height of the bar in pixels (defaults to 8) */
  height?: number;
  /** CSS colour for the filled portion (defaults to var(--color-primary)) */
  color?: string;
  /** Additional class names applied to the wrapper */
  className?: string;
}

/**
 * ProgressBar renders an accessible progress indicator backed by a native
 * `<div role="progressbar">` element with proper ARIA attributes.
 *
 * @example
 * <ProgressBar value={650} max={1000} label="Trust Score" />
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  ariaLabel,
  height = 8,
  color,
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div className={`progress-bar-wrapper ${className}`}>
      {label && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.25rem",
            fontSize: "0.82rem",
            color: "var(--color-text-muted)",
          }}
        >
          <span>{label}</span>
          <span>
            {clamped} / {max}
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel ?? label ?? "Progress"}
        style={{
          width: "100%",
          height,
          borderRadius: height / 2,
          background: "var(--color-border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: height / 2,
            background: color ?? "var(--color-primary)",
            transition: "width 0.35s ease",
          }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
