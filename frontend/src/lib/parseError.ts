// frontend/src/lib/parseError.ts
// Maps Clarity contract error codes to human-readable messages for all
// REXONOBIT protocol contracts.

/**
 * @module parseError
 * @description Converts raw `(err uXXX)` Clarity response strings or numeric
 * error codes into user-facing messages. Never expose raw error codes to end
 * users — always run them through `parseContractError` first.
 *
 * Usage:
 *   import { parseContractError } from "@/lib/parseError";
 *   const msg = parseContractError("(err u102)");  // "Not a registered member"
 */

// ---------------------------------------------------------------------------
// Error code registry
// ---------------------------------------------------------------------------

/** Maps numeric error codes to human-readable messages. */
const ERROR_MESSAGES: Readonly<Record<number, string>> = {
  // ── cooperative-registry ──────────────────────────────────────────────
  100: "Protocol not yet initialized",
  101: "Already a registered member",
  102: "Not a registered member",
  103: "Circle not found",
  104: "Circle is full",
  105: "Already a circle member",
  106: "Not a circle member",
  107: "Unauthorized — circle lead only",
  108: "Invalid circle configuration",
  109: "Circle name too long",

  // ── savings-vault ──────────────────────────────────────────────────────
  200: "Insufficient vault balance",
  201: "Deposit amount too low",
  202: "Withdrawal amount too low",
  203: "Vault is locked",
  204: "Lock period not yet expired",
  205: "Lock amount exceeds available balance",

  // ── lending-pool ──────────────────────────────────────────────────────
  300: "Lending pool not found",
  301: "Pool has insufficient liquidity",
  302: "Loan amount exceeds pool limit",
  303: "Loan not found",
  304: "Loan is not active",
  305: "Loan already repaid",
  306: "Repayment amount is too low",
  307: "Loan is not overdue — cannot liquidate",
  308: "Unauthorized — only pool lender can liquidate",

  // ── rosca ─────────────────────────────────────────────────────────────
  400: "ROSCA not found",
  401: "ROSCA already started",
  402: "ROSCA already full",
  403: "Already a ROSCA member",
  404: "Not a ROSCA member",
  405: "ROSCA is not accepting contributions",
  406: "Contribution amount is incorrect",
  407: "Already contributed this round",
  408: "Payout order not set",
  409: "Payout not yet due",
  410: "ROSCA is locked — waiting for start",

  // ── governance ────────────────────────────────────────────────────────
  500: "Proposal not found",
  501: "Voting period has ended",
  502: "Voting period is still open",
  503: "Already voted on this proposal",
  504: "Proposal already executed",
  505: "Proposal did not pass",
  506: "Insufficient voting power",
  507: "Proposal title too long",
  508: "Unauthorized — not a governance member",

  // ── treasury ──────────────────────────────────────────────────────────
  600: "Treasury not found",
  601: "Deposit amount is zero",
  602: "Spend proposal not found",
  603: "Spend amount exceeds treasury balance",
  604: "Spend proposal already executed",
  605: "Spend proposal not approved",

  // ── trust-score ───────────────────────────────────────────────────────
  700: "Trust score not found",
  701: "Score update too frequent — cooldown active",
  702: "Invalid score delta",

  // ── reputation-nft ────────────────────────────────────────────────────
  800: "NFT not found",
  801: "Badge already minted for this milestone",
  802: "Milestone requirements not met",
  803: "NFT transfer not permitted",

  // ── labor-market ──────────────────────────────────────────────────────
  900: "Task not found",
  901: "Task is not open for bids",
  902: "Bid not found",
  903: "Not the task poster",
  904: "Not the assigned worker",
  905: "Task not in completion state",
  906: "Already bid on this task",
  907: "Bid amount exceeds task budget",
  908: "Task has been cancelled",
  909: "Dispute already open",
  910: "No active dispute on this task",

  // ── arbitration ───────────────────────────────────────────────────────
  1000: "Dispute not found",
  1001: "Dispute not open",
  1002: "Already on panel",
  1003: "Panel is full",
  1004: "Unauthorized — not a panel member",
  1005: "Verdict already submitted",
  1006: "Cannot dispute your own task",
  1007: "Self-arbitration not allowed",

  // ── synthetic-credit ──────────────────────────────────────────────────
  1100: "Insufficient collateral",
  1101: "Mint amount too low",
  1102: "Burn amount exceeds balance",
  1103: "Collateral ratio below minimum",
  1104: "Credit position not found",

  // ── protocol-config ───────────────────────────────────────────────────
  1200: "Already initialized",
  1201: "Unauthorized — deployer only",
  1202: "Invalid configuration value",
};

const FALLBACK_MESSAGE = "An unexpected error occurred. Please try again.";

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Extracts the numeric code from a Clarity `(err uXXX)` string.
 * Returns `null` if the input is not a recognizable error response.
 */
export function extractErrorCode(clarityError: string): number | null {
  // Matches: (err u123) or (err 123)
  const match = /\(err\s+u?(\d+)\)/i.exec(clarityError.trim());
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Returns a human-readable message for a Clarity error response string or
 * numeric error code.
 *
 * @param input  A Clarity `(err uXXX)` string, a raw number, or any string.
 *
 * @example
 * parseContractError("(err u102)");  // "Not a registered member"
 * parseContractError(303);           // "Loan not found"
 * parseContractError("network timeout"); // "network timeout"  (pass-through)
 */
export function parseContractError(input: string | number): string {
  if (typeof input === "number") {
    return ERROR_MESSAGES[input] ?? FALLBACK_MESSAGE;
  }

  const code = extractErrorCode(input);
  if (code !== null) {
    return ERROR_MESSAGES[code] ?? `Contract error code ${code}`;
  }

  // Pass through non-Clarity error strings (e.g., network errors)
  return input.length > 0 ? input : FALLBACK_MESSAGE;
}

/**
 * Returns `true` when the Clarity response represents a success `(ok ...)`.
 */
export function isOk(clarityResponse: string): boolean {
  return clarityResponse.trimStart().startsWith("(ok");
}

/**
 * Returns `true` when the Clarity response represents an error `(err ...)`.
 */
export function isErr(clarityResponse: string): boolean {
  return clarityResponse.trimStart().startsWith("(err");
}

export { ERROR_MESSAGES };
export default parseContractError;
