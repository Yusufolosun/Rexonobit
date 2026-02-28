import type React from "react";
import CopyButton from "@/components/CopyButton";
import TooltipWrapper from "@/components/TooltipWrapper";
import { truncateAddress } from "@/lib/format";

interface AddressDisplayProps {
  /** Full Stacks address (SP…, ST… or SM…). */
  address: string;
  /** Number of characters to show at start. Defaults to 4. */
  prefixLen?: number;
  /** Number of characters to show at end. Defaults to 5. */
  suffixLen?: number;
  /** Whether to show a copy-to-clipboard button. */
  copyable?: boolean;
  /** Whether to show the full address in a tooltip. */
  tooltip?: boolean;
  /** Mono-space the address display. Defaults to true. */
  mono?: boolean;
  /** Extra CSS class names. */
  className?: string;
}

/**
 * AddressDisplay
 *
 * Renders a truncated Stacks principal address with optional clipboard
 * copy button and tooltip showing the full address.
 *
 * @example
 * <AddressDisplay address={wallet} copyable tooltip />
 */
const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  prefixLen = 4,
  suffixLen = 5,
  copyable = false,
  tooltip = false,
  mono = true,
  className = "",
}) => {
  const truncated = truncateAddress(address, prefixLen, suffixLen);

  const addrSpan = (
    <span
      className={`${mono ? "font-mono" : ""} ${className}`}
      aria-label={`Address ${truncated}`}
      style={{
        fontSize: "0.875rem",
        letterSpacing: mono ? "0.03em" : undefined,
        fontFamily: mono ? "'Fira Code', 'Courier New', monospace" : undefined,
      }}
    >
      {truncated}
    </span>
  );

  return (
    <span
      className="address-display"
      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
    >
      {tooltip ? (
        <TooltipWrapper content={address} placement="top">
          {addrSpan}
        </TooltipWrapper>
      ) : (
        addrSpan
      )}
      {copyable && (
        <CopyButton
          value={address}
          label=""
          successLabel=""
          ariaLabel={`Copy address ${truncated}`}
          className="address-display__copy"
          resetAfter={2000}
        />
      )}
    </span>
  );
};

export default AddressDisplay;
