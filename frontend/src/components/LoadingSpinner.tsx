import React from "react";

type SpinnerSize = "xs" | "sm" | "md" | "lg";
type SpinnerColor = "accent" | "white" | "muted" | string;

const SIZE_MAP: Record<SpinnerSize, number> = {
  xs: 14,
  sm: 20,
  md: 28,
  lg: 40,
};

interface LoadingSpinnerProps {
  /** Size of the spinner. */
  size?: SpinnerSize;
  /**
   * Stroke color. Use "accent", "white", "muted", or any CSS color value.
   */
  color?: SpinnerColor;
  /** Screen-reader label. Defaults to "Loading…" */
  label?: string;
  /** Whether to center the spinner in a flex container. */
  centered?: boolean;
  /** Additional CSS class names. */
  className?: string;
}

const COLOR_MAP: Record<string, string> = {
  accent: "var(--accent, #6366f1)",
  white: "#ffffff",
  muted: "var(--text-secondary)",
};

/**
 * LoadingSpinner
 *
 * Accessible SVG spinner with configurable size and color.
 * Uses a CSS animation so it works without JS-driven re-renders.
 *
 * @example
 * // Inline usage
 * {isLoading && <LoadingSpinner size="sm" />}
 *
 * // Centered full-section
 * <LoadingSpinner size="lg" centered />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "accent",
  label = "Loading…",
  centered = false,
  className = "",
}) => {
  const px = SIZE_MAP[size as SpinnerSize] ?? SIZE_MAP.md;
  const stroke = COLOR_MAP[color] ?? color;

  const spinner = (
    <svg
      role="status"
      aria-label={label}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`loading-spinner ${className}`}
      style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={stroke}
        strokeWidth="3"
        strokeDasharray="30 60"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );

  if (centered) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
