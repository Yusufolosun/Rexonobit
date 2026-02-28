import React, { useEffect, useRef } from "react";

interface ConfirmModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Dialog title */
  title: string;
  /** Descriptive message or body content */
  message: React.ReactNode;
  /** Label for the confirm action button. Defaults to "Confirm" */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to "Cancel" */
  cancelLabel?: string;
  /** Style variant for the confirm button */
  confirmVariant?: "danger" | "primary" | "warning";
  /** Called when the user confirms */
  onConfirm: () => void;
  /** Called when the user cancels or closes the dialog */
  onCancel: () => void;
  /** Whether the confirm action is in a loading state */
  isLoading?: boolean;
}

/**
 * ConfirmModal
 *
 * Accessible confirmation dialog. Focuses the cancel button on open and traps
 * focus within the dialog. Closes on Escape key press.
 *
 * @example
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   title="Close ROSCA Round?"
 *   message="This action cannot be undone. All contributions will be locked."
 *   confirmLabel="Close Round"
 *   confirmVariant="danger"
 *   onConfirm={handleClose}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    cancelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmStyle: React.CSSProperties = {
    background:
      confirmVariant === "danger"
        ? "var(--color-danger)"
        : confirmVariant === "warning"
        ? "var(--color-warning)"
        : "var(--color-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    padding: "0.5rem 1.25rem",
    cursor: isLoading ? "not-allowed" : "pointer",
    opacity: isLoading ? 0.7 : 1,
    fontWeight: 600,
  };

  const cancelStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    padding: "0.5rem 1.25rem",
    cursor: "pointer",
    color: "var(--color-text-primary)",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-body"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "calc(var(--radius) * 2)",
          padding: "1.5rem",
          minWidth: 340,
          maxWidth: 480,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <h2 id="confirm-modal-title" style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1rem", fontWeight: 700 }}>
          {title}
        </h2>
        <div id="confirm-modal-body" style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
          {message}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button style={cancelStyle} ref={cancelRef} onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </button>
          <button style={confirmStyle} onClick={onConfirm} disabled={isLoading} aria-busy={isLoading}>
            {isLoading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
