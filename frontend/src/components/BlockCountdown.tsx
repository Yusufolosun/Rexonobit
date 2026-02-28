import React from "react";
import { blocksToHuman, blockHeightToEta, blocksUntil, isPast } from "@/lib/datetime";

interface BlockCountdownProps {
  /** Current chain tip block height. */
  currentBlock: number;
  /** Target block height to count down to. */
  targetBlock: number;
  /** Label shown before the countdown. Defaults to "Expires in". */
  label?: string;
  /** Label shown when target is in the past. Defaults to "Expired". */
  expiredLabel?: string;
  /** Whether to show the estimated wall-clock date alongside blocks. */
  showDate?: boolean;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * BlockCountdown
 *
 * Displays a human-readable block countdown to a future target block.
 * Optionally shows the estimated wall-clock ETA.
 *
 * Uses `blocksToHuman` and `blockHeightToEta` from `lib/datetime`.
 *
 * @example
 * <BlockCountdown
 *   currentBlock={chainTip}
 *   targetBlock={loan.dueBlock}
 *   label="Loan due"
 *   showDate
 * />
 */
const BlockCountdown: React.FC<BlockCountdownProps> = ({
  currentBlock,
  targetBlock,
  label = "Expires in",
  expiredLabel = "Expired",
  showDate = false,
  className = "",
}) => {
  const expired = isPast(targetBlock, currentBlock);
  const remaining = blocksUntil(targetBlock, currentBlock);
  const humanTime = blocksToHuman(remaining);

  let etaString: string | null = null;
  if (showDate && !expired) {
    const eta = blockHeightToEta(targetBlock, currentBlock);
    etaString = eta.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <span
      className={`block-countdown ${expired ? "block-countdown--expired" : ""} ${className}`}
      title={`Block ${targetBlock} (current: ${currentBlock})`}
      aria-label={expired ? expiredLabel : `${label}: ${humanTime}`}
    >
      {expired ? (
        <span style={{ color: "var(--error, #ef4444)", fontWeight: 600 }}>
          {expiredLabel}
        </span>
      ) : (
        <>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
            {label}:{" "}
          </span>
          <span style={{ fontWeight: 600 }}>{humanTime}</span>
          {etaString && (
            <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem", marginLeft: "0.4rem" }}>
              ({etaString})
            </span>
          )}
        </>
      )}
    </span>
  );
};

export default BlockCountdown;
