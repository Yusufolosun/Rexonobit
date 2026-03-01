import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { truncateAddress } from "../lib/format";


// ---------------------------------------------------------------------------
// AddressCard — display a Stacks principal with a copy-to-clipboard action
// ---------------------------------------------------------------------------

interface AddressCardProps {
  /** Full Stacks address (ST… / SP…) */
  address: string;
  /** Optional label shown above the address (e.g. "Recipient") */
  label?: string;
  /** Number of leading chars visible (default: 6) */
  startChars?: number;
  /** Number of trailing chars visible (default: 4) */
  endChars?: number;
  /** Show the full address on hover via title attribute (default: true) */
  showTitle?: boolean;
  /** Extra class names for the wrapper element */
  className?: string;
}

/**
 * AddressCard renders a truncated Stacks address inside a small chip with a
 * one-click copy button.  The full address is accessible via the `title`
 * attribute and an `aria-label` on the copy button.
 *
 * @example
 * <AddressCard address={senderAddress} label="Sender" />
 */
export function AddressCard({
  address,
  label,
  startChars = 6,
  endChars = 4,
  showTitle = true,
  className = "",
}: AddressCardProps) {
  const { copyToClipboard, copied } = useCopyToClipboard();
  const truncated = truncateAddress(address, startChars, endChars);

  return (
    <div
      className={`address-card ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: "0.15rem",
      }}
    >
      {label && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "0.4rem",
          padding: "0.2rem 0.5rem",
          fontSize: "0.85rem",
          fontFamily: "monospace",
        }}
      >
        <span title={showTitle ? address : undefined}>{truncated}</span>
        <button
          type="button"
          aria-label={copied ? "Address copied" : `Copy address ${truncated}`}
          onClick={() => copyToClipboard(address)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            color: copied ? "var(--color-success, #22c55e)" : "var(--color-text-muted)",
            transition: "color 0.2s",
          }}
        >
          {copied ? (
            // Checkmark icon
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            // Copy icon
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default AddressCard;
