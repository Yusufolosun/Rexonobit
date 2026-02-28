import React, { useEffect } from "react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useTimeout } from "@/hooks/useTimeout";

interface CopyButtonProps {
  /** The text to copy to the clipboard. */
  value: string;
  /** Button label when idle. Defaults to "Copy". */
  label?: string;
  /** Button label after successful copy. Defaults to "Copied!". */
  successLabel?: string;
  /** Milliseconds to show the success label. Defaults to 2000. */
  resetAfter?: number;
  /** Additional class names. */
  className?: string;
  /** Optional aria-label override. */
  ariaLabel?: string;
}

/**
 * CopyButton
 *
 * A button that copies a value to the clipboard and shows brief confirmation.
 * Uses `useCopyToClipboard` for cross-browser clipboard access and
 * `useTimeout` to reset the label after `resetAfter` ms.
 *
 * @example
 * <CopyButton value={walletAddress} label="Copy address" />
 */
const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  label = "Copy",
  successLabel = "Copied!",
  resetAfter = 2000,
  className = "",
  ariaLabel,
}) => {
  const { copy, copied } = useCopyToClipboard();
  const { set: startReset } = useTimeout(() => {}, resetAfter);

  useEffect(() => {
    if (copied) startReset();
  }, [copied, startReset]);

  const handleClick = () => {
    void copy(value);
  };

  return (
    <button
      type="button"
      className={`copy-button ${copied ? "copy-button--success" : ""} ${className}`}
      onClick={handleClick}
      aria-label={ariaLabel ?? `${label}: ${value}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.3rem 0.75rem",
        borderRadius: "5px",
        border: "1px solid var(--border)",
        background: copied ? "var(--success-bg, #dcfce7)" : "var(--bg)",
        color: copied ? "var(--success-fg, #15803d)" : "var(--text-primary)",
        cursor: "pointer",
        fontSize: "0.8rem",
        fontWeight: 500,
        transition: "background 0.2s ease, color 0.2s ease",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true">{copied ? "✓" : "⎘"}</span>
      {copied ? successLabel : label}
    </button>
  );
};

export default CopyButton;
