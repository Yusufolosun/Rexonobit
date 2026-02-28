// frontend/src/lib/constants.ts
// Shared constants: contract names, error codes, thresholds

// ---------------------------------------------------------------------------
// Contract names — keep in sync with Clarinet.toml
// ---------------------------------------------------------------------------
export const CONTRACT_NAMES = {
  protocolConfig: "protocol-config",
  cooperativeRegistry: "cooperative-registry",
  savingsVault: "savings-vault",
  lendingPool: "lending-pool",
  rosca: "rosca",
  laborMarket: "labor-market",
  governance: "governance",
  arbitration: "arbitration",
  treasury: "treasury",
  trustScore: "trust-score",
  reputationNft: "reputation-nft",
  syntheticCredit: "synthetic-credit",
} as const;

export type ContractName = (typeof CONTRACT_NAMES)[keyof typeof CONTRACT_NAMES];

// ---------------------------------------------------------------------------
// Clarity error codes (uint values returned as ERR responses)
// ---------------------------------------------------------------------------
export const ERROR_CODES = {
  notMember: 400,
  unauthorized: 401,
  alreadyInitialized: 402,
  insufficientBalance: 403,
  tooEarly: 404,
  tooLate: 405,
  invalidAmount: 406,
  notFound: 407,
  alreadyMember: 408,
  loanActive: 409,
  circleNotActive: 410,
} as const;

// ---------------------------------------------------------------------------
// Trust score tier thresholds (in basis points / 0–1000 scale)
// ---------------------------------------------------------------------------
export const TRUST_TIER_THRESHOLDS = {
  platinum: 900,
  gold: 700,
  silver: 500,
  bronze: 300,
  newcomer: 0,
} as const;

export type TrustTier = keyof typeof TRUST_TIER_THRESHOLDS;

// ---------------------------------------------------------------------------
// STX micro-unit conversion
// ---------------------------------------------------------------------------
export const MICROSTX_PER_STX = 1_000_000;

export function microstxToStx(microstx: number): number {
  return microstx / MICROSTX_PER_STX;
}

export function stxToMicrostx(stx: number): number {
  return Math.round(stx * MICROSTX_PER_STX);
}

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------
export const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Polling interval (ms) — used when window focus refresh is insufficient
// ---------------------------------------------------------------------------
export const POLL_INTERVAL_MS = 30_000;
