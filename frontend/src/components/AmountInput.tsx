import React, { useId } from "react";

const USTX_PER_STX = 1_000_000;

interface AmountInputProps {
  /** Input label. */
  label?: string;
  /** Current value in uSTX (kept as the source of truth). */
  valueUstx: number;
  /** Called on every valid change with the new uSTX amount. */
  onChangeUstx: (uSTX: number) => void;
  /** Minimum allowed STX value (inclusive). Defaults to 0. */
  minStx?: number;
  /** Maximum allowed STX value (inclusive). */
  maxStx?: number;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Hint text shown below the input. */
  hint?: string;
  /** Error message (shown in red below the input). */
  error?: string;
  /** Additional class name on the form-group wrapper. */
  className?: string;
}

/**
 * AmountInput
 *
 * Numeric input for entering STX amounts. Internally displays the value
 * in STX (human-readable) but calls back with the uSTX equivalent.
 *
 * @example
 * <AmountInput
 *   label="Contribution amount"
 *   valueUstx={contributionUstx}
 *   onChangeUstx={setContributionUstx}
 *   minStx={0.5}
 *   hint="Minimum: 0.5 STX"
 * />
 */
const AmountInput: React.FC<AmountInputProps> = ({
  label = "Amount (STX)",
  valueUstx,
  onChangeUstx,
  minStx = 0,
  maxStx,
  disabled = false,
  hint,
  error,
  className = "",
}) => {
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();

  // Display value in STX
  const displayValue = valueUstx > 0 ? (valueUstx / USTX_PER_STX).toString() : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || raw === ".") {
      onChangeUstx(0);
      return;
    }
    const stx = parseFloat(raw);
    if (isNaN(stx) || stx < 0) return;
    onChangeUstx(Math.floor(stx * USTX_PER_STX));
  };

  const hasError = Boolean(error);

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          id={inputId}
          type="number"
          className="form-input"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          min={minStx}
          max={maxStx}
          step="0.000001"
          placeholder="0.000000"
          aria-invalid={hasError}
          aria-describedby={[hasError && errorId, hint && hintId].filter(Boolean).join(" ") || undefined}
          style={{
            paddingRight: "3rem",
            ...(hasError ? { borderColor: "var(--error, #ef4444)" } : {}),
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-secondary)",
            fontSize: "0.8rem",
            pointerEvents: "none",
          }}
        >
          STX
        </span>
      </div>
      {hint && !hasError && (
        <span id={hintId} className="form-hint">
          {hint}
        </span>
      )}
      {hasError && (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default AmountInput;
