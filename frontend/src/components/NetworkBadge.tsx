import React from "react";

export type NetworkMode = "mainnet" | "testnet" | "devnet" | "mocknet";

interface NetworkBadgeProps {
  /** The active Stacks network */
  network: NetworkMode;
  /** Show the full label text (default true) */
  showLabel?: boolean;
  /** Extra CSS class */
  className?: string;
}

const NETWORK_CONFIG: Record<
  NetworkMode,
  { label: string; bg: string; color: string; dot: string }
> = {
  mainnet: {
    label: "Mainnet",
    bg: "rgba(34,197,94,0.12)",
    color: "#16a34a",
    dot: "#22c55e",
  },
  testnet: {
    label: "Testnet",
    bg: "rgba(249,115,22,0.12)",
    color: "#c2410c",
    dot: "#f97316",
  },
  devnet: {
    label: "Devnet",
    bg: "rgba(139,92,246,0.12)",
    color: "#7c3aed",
    dot: "#8b5cf6",
  },
  mocknet: {
    label: "Mocknet",
    bg: "rgba(148,163,184,0.15)",
    color: "#64748b",
    dot: "#94a3b8",
  },
};

/**
 * NetworkBadge
 *
 * Displays the active Stacks network (mainnet/testnet/devnet/mocknet) as a
 * colour-coded pill badge.
 *
 * @example
 * const { network } = useWallet();
 * <NetworkBadge network={network} />
 */
export default function NetworkBadge({
  network,
  showLabel = true,
  className = "",
}: NetworkBadgeProps) {
  const config = NETWORK_CONFIG[network] ?? NETWORK_CONFIG.testnet;

  return (
    <span
      className={`network-badge ${className}`}
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
        letterSpacing: "0.025em",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
      aria-label={`Active network: ${config.label}`}
    >
      <span
        aria-hidden="true"
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: config.dot,
          flexShrink: 0,
        }}
      />
      {showLabel && config.label}
    </span>
  );
}
