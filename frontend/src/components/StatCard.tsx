import React from "react";

// ---------------------------------------------------------------------------
// StatCard — single-metric display card for protocol dashboards
// ---------------------------------------------------------------------------

interface StatCardProps {
  /** Metric title (e.g. "Total Locked STX") */
  title: string;
  /** Formatted value string (e.g. "1,234.56 STX") */
  value: string;
  /** Optional sub-value or secondary label shown below value */
  sub?: string;
  /** Optional icon element rendered to the left of the value */
  icon?: React.ReactNode;
  /** Optional accent colour for the left border stripe */
  accentColor?: string;
  /** Extra class names for the wrapper */
  className?: string;
  /** Loading state — shows a skeleton placeholder instead of value */
  loading?: boolean;
}

/**
 * StatCard renders a compact at-a-glance metric card.
 * Pass `loading={true}` to show an animated skeleton while data loads.
 *
 * @example
 * <StatCard title="Total Deposited" value={formatMicroSTX(totalDeposited)} />
 */
export function StatCard({
  title,
  value,
  sub,
  icon,
  accentColor,
  className = "",
  loading = false,
}: StatCardProps) {
  return (
    <div
      className={`stat-card card ${className}`}
      style={{
        borderLeft: accentColor ? `3px solid ${accentColor}` : "3px solid var(--color-primary)",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
      aria-label={`${title}: ${loading ? "loading" : value}`}
    >
      <span
        style={{
          fontSize: "0.78rem",
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontWeight: 500,
        }}
      >
        {title}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {icon && (
          <span aria-hidden="true" style={{ fontSize: "1.2rem" }}>
            {icon}
          </span>
        )}
        {loading ? (
          <div
            aria-busy="true"
            aria-label="Loading"
            style={{
              height: "1.4rem",
              width: "6rem",
              borderRadius: "0.3rem",
              background: "var(--color-border)",
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "var(--color-text)",
              lineHeight: 1.1,
            }}
          >
            {value}
          </span>
        )}
      </div>
      {sub && !loading && (
        <span
          style={{
            fontSize: "0.78rem",
            color: "var(--color-text-muted)",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

export default StatCard;
