// frontend/src/lib/types.ts
// Shared domain types for the REXONOBIT protocol frontend

/**
 * @module types
 * @description Canonical TypeScript type definitions for all protocol domain
 * objects returned from contract read calls and used across hooks/components.
 * Import these types instead of redeclaring inline interfaces in components.
 */

// ---------------------------------------------------------------------------
// Branded primitives
// ---------------------------------------------------------------------------

/** Stacks principal address (c32check encoded). */
export type StacksPrincipal = string & { readonly __brand: "StacksPrincipal" };

/** Transaction ID (hex, 64 chars). */
export type TxId = string & { readonly __brand: "TxId" };

/** On-chain block height. */
export type BlockHeight = number & { readonly __brand: "BlockHeight" };

// ---------------------------------------------------------------------------
// Trust score
// ---------------------------------------------------------------------------

export type TrustTier = "bronze" | "silver" | "gold" | "platinum" | "none";

export interface TrustScoreData {
  /** Raw trust score (0–1000). */
  score: number;
  /** Human-readable tier label. */
  tier: TrustTier;
  /** Block at which the score was last updated. */
  lastUpdated: BlockHeight;
}

// ---------------------------------------------------------------------------
// Savings vault
// ---------------------------------------------------------------------------

export interface VaultData {
  /** Available (unlocked) STX balance in micro-STX. */
  balance: number;
  /** STX currently locked as collateral in micro-STX. */
  lockedBalance: number;
  /** Block at which the lock expires (0 if nothing locked). */
  lockedUntil: BlockHeight;
  /** Number of consecutive deposit streak periods completed. */
  streak: number;
}

// ---------------------------------------------------------------------------
// Lending pool
// ---------------------------------------------------------------------------

export type LoanStatus = "active" | "repaid" | "defaulted";

export interface Loan {
  /** On-chain loan ID. */
  loanId: number;
  /** Borrower principal. */
  borrower: StacksPrincipal;
  /** Loan amount in micro-STX. */
  amount: number;
  /** Repayment due block. */
  dueBlock: BlockHeight;
  /** Current status. */
  status: LoanStatus;
}

export interface LendingPool {
  circleId: number;
  /** Total available pool balance in micro-STX. */
  balance: number;
}

// ---------------------------------------------------------------------------
// ROSCA
// ---------------------------------------------------------------------------

export type RoscaStatus = "open" | "active" | "complete" | "closed";

export interface RoscaGroup {
  roscaId: number;
  name: string;
  creator: StacksPrincipal;
  memberCount: number;
  contributionAmount: number;
  status: RoscaStatus;
}

// ---------------------------------------------------------------------------
// Cooperative registry / circle
// ---------------------------------------------------------------------------

export interface Circle {
  circleId: number;
  name: string;
  creator: StacksPrincipal;
  memberCount: number;
  /** Whether the circle is accepting new members. */
  active: boolean;
}

// ---------------------------------------------------------------------------
// Labor market
// ---------------------------------------------------------------------------

export type TaskStatus = "open" | "assigned" | "submitted" | "complete" | "disputed";

export interface Task {
  taskId: number;
  poster: StacksPrincipal;
  description: string;
  bounty: number;
  status: TaskStatus;
  assignee?: StacksPrincipal;
}

// ---------------------------------------------------------------------------
// Treasury
// ---------------------------------------------------------------------------

export type ProposalStatus = "active" | "pending" | "executed" | "expired" | "vetoed";

export interface SpendProposal {
  proposalId: number;
  proposer: StacksPrincipal;
  recipient: StacksPrincipal;
  amount: number;
  description: string;
  yesVotes: number;
  noVotes: number;
  status: ProposalStatus;
  expiresAt: BlockHeight;
}

// ---------------------------------------------------------------------------
// Governance
// ---------------------------------------------------------------------------

export type ProposalType = "PARAM-CHANGE" | "TREASURY-SPEND" | "EXPEL-MEMBER" | "POLICY-UPDATE";

export interface GovernanceProposal {
  proposalId: number;
  proposer: StacksPrincipal;
  proposalType: ProposalType;
  description: string;
  yesVotes: number;
  noVotes: number;
  status: ProposalStatus;
  expiresAt: BlockHeight;
}

// ---------------------------------------------------------------------------
// Arbitration
// ---------------------------------------------------------------------------

export type DisputeStatus = "open" | "resolved" | "closed";

export interface Dispute {
  disputeId: number;
  claimant: StacksPrincipal;
  respondent: StacksPrincipal;
  circleId: number;
  description: string;
  panelSize: number;
  status: DisputeStatus;
}

// ---------------------------------------------------------------------------
// sCREDIT
// ---------------------------------------------------------------------------

export interface SCreditPosition {
  /** Current sCREDIT balance. */
  balance: number;
  /** Maximum mintable sCREDIT given current collateral. */
  creditLimit: number;
  /** Trust score used in ceiling calculation. */
  trustScore: number;
  /** Locked STX serving as collateral in micro-STX. */
  lockedSavings: number;
}

// ---------------------------------------------------------------------------
// Protocol stats
// ---------------------------------------------------------------------------

export interface ProtocolStats {
  totalMembers: number;
  totalCircles: number;
  poolBalance: number;
  treasuryBalance: number;
}

// ---------------------------------------------------------------------------
// Transaction result helpers
// ---------------------------------------------------------------------------

export type TxStatus = "success" | "abort_by_response" | "abort_by_post_condition" | "pending";

export interface TxResult {
  txid: TxId;
  status?: TxStatus;
}
