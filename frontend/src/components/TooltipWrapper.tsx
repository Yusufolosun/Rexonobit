import React, { useId } from "react";

type TooltipPlacement = "top" | "bottom" | "left" | "right";

interface TooltipWrapperProps {
  /** The element(s) that trigger the tooltip on hover/focus. */
  children: React.ReactNode;
  /** Tooltip content string. */
  content: string;
  /** Preferred tooltip placement. */
  placement?: TooltipPlacement;
  /** Whether the tooltip is disabled. */
  disabled?: boolean;
  /** Additional class name applied to the wrapper element. */
  className?: string;
}

const PLACEMENT_STYLE: Record<TooltipPlacement, React.CSSProperties> = {
  top: { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
  bottom: { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
  left: { right: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
  right: { left: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
};

/**
 * TooltipWrapper
 *
 * Wraps any element to provide an accessible CSS-powered tooltip.
 * The tooltip is shown on hover and on keyboard focus-within.
 *
 * Uses `aria-describedby` on children for screen reader support.
 *
 * @example
 * <TooltipWrapper content="Copy wallet address" placement="top">
 *   <button onClick={handleCopy}>Copy</button>
 * </TooltipWrapper>
 */
const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  children,
  content,
  placement = "top",
  disabled = false,
  className = "",
}) => {
  const tooltipId = useId();

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <span
      className={`tooltip-wrapper ${className}`}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {/* Attach describedby to the first interactive child via a wrapping span */}
      <span aria-describedby={tooltipId} style={{ display: "contents" }}>
        {children}
      </span>

      <span
        id={tooltipId}
        role="tooltip"
        className="tooltip"
        style={{
          position: "absolute",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          background: "var(--tooltip-bg, #1e1e2e)",
          color: "var(--tooltip-fg, #ffffff)",
          padding: "0.3rem 0.65rem",
          borderRadius: "5px",
          fontSize: "0.78rem",
          zIndex: 9999,
          opacity: 0,
          transition: "opacity 0.15s ease",
          ...PLACEMENT_STYLE[placement],
        }}
      >
        {content}
      </span>
    </span>
  );
};

export default TooltipWrapper;
