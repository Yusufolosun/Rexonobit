export type TxStatus =
  | "pending"
  | "success"
  | "abort_by_response"
  | "abort_by_post_condition"
  | "dropped"
  | "not_found";

interface TxStatusBadgeProps {
  status: TxStatus | string;
  /** Show a spinner for pending state */
  animated?: boolean;
  className?: string;
}

type StatusConfig = { label: string; bg: string; color: string };

const STATUS_MAP: Record<string, StatusConfig> = {
  pending: { label: "Pending", bg: "rgba(249,115,22,0.1)", color: "#c2410c" },
  success: { label: "Confirmed", bg: "rgba(34,197,94,0.1)", color: "#15803d" },
  abort_by_response: { label: "Aborted", bg: "rgba(239,68,68,0.1)", color: "#b91c1c" },
  abort_by_post_condition: { label: "Post-cond fail", bg: "rgba(239,68,68,0.1)", color: "#b91c1c" },
  dropped: { label: "Dropped", bg: "rgba(148,163,184,0.15)", color: "#64748b" },
  not_found: { label: "Not found", bg: "rgba(148,163,184,0.15)", color: "#64748b" },
};

const FALLBACK: StatusConfig = { label: "Unknown", bg: "rgba(148,163,184,0.15)", color: "#64748b" };

/**
 * TxStatusBadge
 *
 * Displays a Stacks transaction status as a colour-coded badge.
 * Accepts the raw `tx_status` string from the Stacks API.
 *
 * @example
 * const { data: tx } = useTx(txId);
 * <TxStatusBadge status={tx?.tx_status ?? "pending"} animated />
 */
export default function TxStatusBadge({ status, animated = false, className = "" }: TxStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? FALLBACK;

  return (
    <span
      className={`tx-status-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.2rem 0.6rem",
        borderRadius: 9999,
        background: config.bg,
        color: config.color,
        fontSize: "0.75rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
      aria-label={`Transaction status: ${config.label}`}
    >
      {animated && status === "pending" && (
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: config.color,
            flexShrink: 0,
            animation: "pulse 1.5s infinite",
          }}
        />
      )}
      {!animated || status !== "pending" ? (
        <span
          aria-hidden="true"
          style={{ width: 7, height: 7, borderRadius: "50%", background: config.color, flexShrink: 0 }}
        />
      ) : null}
      {config.label}
    </span>
  );
}
