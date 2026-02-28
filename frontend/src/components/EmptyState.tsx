import React from "react";

interface EmptyStateProps {
  /** Icon element to display (e.g. an SVG or emoji span). */
  icon?: React.ReactNode;
  /** Primary heading text. */
  title: string;
  /** Optional supporting message below the title. */
  message?: string;
  /** Optional action button or link. */
  action?: React.ReactNode;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * EmptyState
 *
 * Renders a centered empty-state illustration with a title, optional
 * description, and optional call-to-action. Used when a list or panel
 * has no data to display.
 *
 * @example
 * <EmptyState
 *   icon={<span aria-hidden="true">📭</span>}
 *   title="No active circles"
 *   message="Join or create a cooperative circle to get started."
 *   action={<button className="btn-primary" onClick={onCreate}>Create Circle</button>}
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className = "",
}) => {
  return (
    <div
      role="status"
      aria-label={title}
      className={`empty-state ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "3rem 1.5rem",
        gap: "1rem",
      }}
    >
      {icon && (
        <div
          className="empty-state__icon"
          style={{ fontSize: "3rem", lineHeight: 1, opacity: 0.6 }}
        >
          {icon}
        </div>
      )}

      <h3
        className="empty-state__title"
        style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}
      >
        {title}
      </h3>

      {message && (
        <p
          className="empty-state__message"
          style={{
            margin: 0,
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            maxWidth: "360px",
          }}
        >
          {message}
        </p>
      )}

      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};

export default EmptyState;
