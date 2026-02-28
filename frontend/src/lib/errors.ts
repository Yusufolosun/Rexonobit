/**
 * lib/errors.ts
 *
 * Typed error classes and contract error parsing utilities.
 *
 * Security note: Never surface raw error internals to end users.
 * Use `getUserMessage()` to display safe, localised messages.
 */

// -------------------------------------------------------
// Base error class
// -------------------------------------------------------

export class RexonobitError extends Error {
  readonly code: number | string;
  constructor(message: string, code: number | string) {
    super(message);
    this.name = "RexonobitError";
    this.code = code;
  }
}

// -------------------------------------------------------
// Specific error types
// -------------------------------------------------------

export class ContractError extends RexonobitError {
  constructor(code: number) {
    super(`Contract error: ${code}`, code);
    this.name = "ContractError";
  }
}

export class WalletError extends RexonobitError {
  constructor(message: string) {
    super(message, "WALLET_ERROR");
    this.name = "WalletError";
  }
}

export class NetworkError extends RexonobitError {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message, status ?? "NETWORK_ERROR");
    this.name = "NetworkError";
    this.status = status;
  }
}

export class ValidationError extends RexonobitError {
  readonly field?: string;
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.field = field;
  }
}

// -------------------------------------------------------
// Contract error code → human message map
// -------------------------------------------------------

const CONTRACT_ERROR_MESSAGES: Record<number, string> = {
  // General
  100: "Unauthorized — you do not have permission.",
  101: "Contract is paused.",

  // Cooperative Registry (200–299)
  200: "Cooperative not found.",
  201: "Already a member of this cooperative.",
  202: "Not a member of this cooperative.",
  203: "Cooperative is not active.",

  // Savings Vault (1200–1209)
  1200: "You are not a registered member.",
  1201: "Deposit amount is below the minimum.",
  1202: "Funds are still locked — wait until the lock period expires.",
  1203: "Deposit amount cannot be zero.",
  1204: "No active deposit found.",
  1205: "Transfer failed.",

  // Lending Pool (500–599)
  500: "Insufficient pool liquidity.",
  501: "Loan amount exceeds your credit limit.",
  502: "Loan not found.",
  503: "Loan is already repaid.",
  504: "Repayment amount is insufficient.",

  // ROSCA (1100–1199)
  1100: "ROSCA round not found.",
  1101: "Round is not active.",
  1102: "Already contributed this cycle.",
  1103: "Round is not yet ready for payout.",
  1104: "Recipient is not eligible (delinquent).",

  // Governance (300–399)
  300: "Proposal not found.",
  301: "Proposal is not active.",
  302: "Voting period has ended.",
  303: "Quorum not reached.",
  304: "Already voted on this proposal.",

  // Arbitration (1000–1099)
  1000: "Case not found.",
  1001: "Case is not open.",
  1002: "Evidence already submitted.",
  1003: "Not a party to this case.",

  // Protocol Config (800–899)
  800: "Unauthorized to update configuration.",
  801: "Configuration key does not exist.",
  802: "Value is outside allowed range.",

  // Trust Score (600–699)
  600: "Unauthorized to update trust score.",

  // Reputation NFT (400–499)
  400: "Token not found.",
  401: "NFT is soulbound and cannot be transferred.",
};

/**
 * Parse a Clarity contract error result string and return a typed ContractError.
 *
 * @param clarityResult - e.g. "(err u1200)" or "(err 1200)"
 */
export function parseContractError(clarityResult: string): ContractError | null {
  const match = clarityResult.match(/\(err u?(\d+)\)/);
  if (!match) return null;
  return new ContractError(parseInt(match[1], 10));
}

/**
 * Get a safe, user-friendly message for any error.
 *
 * @param err - Any caught error value
 */
export function getUserMessage(err: unknown): string {
  if (err instanceof ContractError) {
    return CONTRACT_ERROR_MESSAGES[err.code as number] ?? `Unexpected contract error (${err.code}).`;
  }
  if (err instanceof WalletError) {
    return err.message;
  }
  if (err instanceof NetworkError) {
    return err.status === 404
      ? "Resource not found on the blockchain."
      : "Network error — please check your connection.";
  }
  if (err instanceof ValidationError) {
    return err.message;
  }
  if (err instanceof Error) {
    // Sanitise — do not expose stack traces
    return "An unexpected error occurred. Please try again.";
  }
  return "An unknown error occurred.";
}
