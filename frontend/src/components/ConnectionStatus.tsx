import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface ConnectionStatusProps {
  /** Message to show when offline. Defaults to "You are offline." */
  offlineMessage?: string;
  /** Extra CSS class */
  className?: string;
}

/**
 * ConnectionStatus
 *
 * Renders a dismissible warning banner when the browser is offline.
 * Uses `useNetworkStatus` internally — no props required.
 *
 * @example
 * <ConnectionStatus />
 * // Shows nothing when online; shows offline banner when connectivity is lost.
 */
export default function ConnectionStatus({
  offlineMessage = "You are offline. Blockchain data may be stale.",
  className = "",
}: ConnectionStatusProps) {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`connection-status-banner ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: "var(--radius)",
        color: "#b91c1c",
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "1rem" }}>⚡</span>
      {offlineMessage}
    </div>
  );
}
