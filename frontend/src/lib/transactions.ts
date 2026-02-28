// frontend/src/lib/transactions.ts
// Transaction builders for every contract using @stacks/transactions

/**
 * @module transactions
 * @description `openContractCall` wrappers for all 12 REXONOBIT contracts.
 * Each function constructs the appropriate Clarity arguments, invokes a
 * Hiro Wallet signing flow via `@stacks/connect`, and returns the resulting
 * `{ txid }` on success. Never broadcasts a transaction without explicit
 * user approval in the wallet extension.
 */

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringUtf8CV,
  stringAsciiCV,
  boolCV,
  principalCV,
  someCV,
  noneCV,
  listCV,
  type ClarityValue,
  type StacksTransaction,
} from "@stacks/transactions";
import { network, DEPLOYER_ADDRESS, CONTRACT_NAMES } from "./network";
import { userSession } from "./wallet";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSenderKey(): string {
  return userSession.loadUserData().appPrivateKey ?? "";
}

async function callContract(
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[],
  postConditions: never[] = []
): Promise<string> {
  const txOptions = {
    contractAddress: DEPLOYER_ADDRESS,
    contractName,
    functionName,
    functionArgs,
    senderKey: getSenderKey(),
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    postConditions,
  };
  const tx: StacksTransaction = await makeContractCall(txOptions);
  const result = await broadcastTransaction({ transaction: tx, network });
  if ("error" in result) {
    throw new Error(`Broadcast failed: ${result.error} — ${result.reason}`);
  }
  return result.txid;
}

// ─── cooperative-registry ─────────────────────────────────────────────────────

export async function registerMember(displayName: string): Promise<string> {
  return callContract(CONTRACT_NAMES.REGISTRY, "register-member", [
    stringUtf8CV(displayName),
  ]);
}

export async function createCircle(
  name: string,
  description: string,
  isOpen: boolean,
  minDeposit: number
): Promise<string> {
  return callContract(CONTRACT_NAMES.REGISTRY, "create-circle", [
    stringUtf8CV(name),
    stringUtf8CV(description),
    boolCV(isOpen),
    uintCV(minDeposit),
  ]);
}

export async function requestJoin(circleId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.REGISTRY, "request-join", [
    uintCV(circleId),
  ]);
}

export async function vouchFor(
  circleId: number,
  applicant: string
): Promise<string> {
  return callContract(CONTRACT_NAMES.REGISTRY, "vouch-for", [
    uintCV(circleId),
    principalCV(applicant),
  ]);
}

// ─── savings-vault ────────────────────────────────────────────────────────────

export async function initializeVault(): Promise<string> {
  return callContract(CONTRACT_NAMES.SAVINGS_VAULT, "initialize-vault", []);
}

export async function deposit(amount: number): Promise<string> {
  return callContract(CONTRACT_NAMES.SAVINGS_VAULT, "deposit", [
    uintCV(amount),
  ]);
}

export async function lockSavings(
  amount: number,
  lockBlocks: number
): Promise<string> {
  return callContract(CONTRACT_NAMES.SAVINGS_VAULT, "lock-savings", [
    uintCV(amount),
    uintCV(lockBlocks),
  ]);
}

export async function withdraw(amount: number): Promise<string> {
  return callContract(CONTRACT_NAMES.SAVINGS_VAULT, "withdraw", [
    uintCV(amount),
  ]);
}

export async function withdrawLocked(amount: number): Promise<string> {
  return callContract(CONTRACT_NAMES.SAVINGS_VAULT, "withdraw-locked", [
    uintCV(amount),
  ]);
}

// ─── lending-pool ─────────────────────────────────────────────────────────────

export async function fundPool(
  circleId: number,
  amount: number
): Promise<string> {
  return callContract(CONTRACT_NAMES.LENDING_POOL, "fund-pool", [
    uintCV(circleId),
    uintCV(amount),
  ]);
}

export async function requestLoan(
  circleId: number,
  amount: number
): Promise<string> {
  return callContract(CONTRACT_NAMES.LENDING_POOL, "request-loan", [
    uintCV(circleId),
    uintCV(amount),
  ]);
}

export async function repayLoan(
  loanId: number,
  amount: number
): Promise<string> {
  return callContract(CONTRACT_NAMES.LENDING_POOL, "repay", [
    uintCV(loanId),
    uintCV(amount),
  ]);
}

export async function liquidateDefaulter(loanId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.LENDING_POOL, "liquidate-defaulter", [
    uintCV(loanId),
  ]);
}

// ─── rosca ────────────────────────────────────────────────────────────────────

export async function createRosca(
  name: string,
  contribution: number,
  memberCount: number,
  cycleBlocks: number
): Promise<string> {
  return callContract(CONTRACT_NAMES.ROSCA, "create-rosca", [
    stringUtf8CV(name),
    uintCV(contribution),
    uintCV(memberCount),
    uintCV(cycleBlocks),
  ]);
}

export async function joinRosca(roscaId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.ROSCA, "join-rosca", [uintCV(roscaId)]);
}

export async function contribute(roscaId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.ROSCA, "contribute", [uintCV(roscaId)]);
}

export async function payout(roscaId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.ROSCA, "payout", [uintCV(roscaId)]);
}

export async function setPayoutOrder(
  roscaId: number,
  order: string[]
): Promise<string> {
  return callContract(CONTRACT_NAMES.ROSCA, "set-payout-order", [
    uintCV(roscaId),
    listCV(order.map((addr) => principalCV(addr))),
  ]);
}

// ─── labor-market ─────────────────────────────────────────────────────────────

export async function postTask(
  circleId: number,
  title: string,
  description: string,
  bounty: number
): Promise<string> {
  return callContract(CONTRACT_NAMES.LABOR_MARKET, "post-task", [
    uintCV(circleId),
    stringUtf8CV(title),
    stringUtf8CV(description),
    uintCV(bounty),
  ]);
}

export async function bidTask(
  taskId: number,
  message: string
): Promise<string> {
  return callContract(CONTRACT_NAMES.LABOR_MARKET, "bid-task", [
    uintCV(taskId),
    stringUtf8CV(message),
  ]);
}

export async function acceptBid(
  taskId: number,
  worker: string
): Promise<string> {
  return callContract(CONTRACT_NAMES.LABOR_MARKET, "accept-bid", [
    uintCV(taskId),
    principalCV(worker),
  ]);
}

export async function submitCompletion(taskId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.LABOR_MARKET, "submit-completion", [
    uintCV(taskId),
  ]);
}

export async function attestTask(
  taskId: number,
  approved: boolean
): Promise<string> {
  return callContract(CONTRACT_NAMES.LABOR_MARKET, "attest", [
    uintCV(taskId),
    boolCV(approved),
  ]);
}

export async function disputeTask(taskId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.LABOR_MARKET, "dispute-task", [
    uintCV(taskId),
  ]);
}

// ─── treasury ─────────────────────────────────────────────────────────────────

export async function depositToTreasury(
  circleId: number,
  amount: number
): Promise<string> {
  return callContract(CONTRACT_NAMES.TREASURY, "deposit-to-treasury", [
    uintCV(circleId),
    uintCV(amount),
  ]);
}

export async function proposeSpend(
  circleId: number,
  recipient: string,
  amount: number,
  description: string
): Promise<string> {
  return callContract(CONTRACT_NAMES.TREASURY, "propose-spend", [
    uintCV(circleId),
    principalCV(recipient),
    uintCV(amount),
    stringUtf8CV(description),
  ]);
}

export async function voteOnProposal(
  proposalId: number,
  approve: boolean
): Promise<string> {
  return callContract(CONTRACT_NAMES.TREASURY, "vote", [
    uintCV(proposalId),
    boolCV(approve),
  ]);
}

export async function executeSpend(proposalId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.TREASURY, "execute-spend", [
    uintCV(proposalId),
  ]);
}

// ─── governance ───────────────────────────────────────────────────────────────

export async function createProposal(
  circleId: number,
  proposalType: number,
  title: string,
  description: string,
  paramKey: string,
  paramValue: number,
  target: string | null
): Promise<string> {
  return callContract(CONTRACT_NAMES.GOVERNANCE, "propose", [
    uintCV(circleId),
    uintCV(proposalType),
    stringUtf8CV(title),
    stringUtf8CV(description),
    stringAsciiCV(paramKey),
    uintCV(paramValue),
    target ? someCV(principalCV(target)) : noneCV(),
  ]);
}

export async function voteOnGovProposal(
  proposalId: number,
  approve: boolean
): Promise<string> {
  return callContract(CONTRACT_NAMES.GOVERNANCE, "vote", [
    uintCV(proposalId),
    boolCV(approve),
  ]);
}

export async function executeGovProposal(proposalId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.GOVERNANCE, "execute-proposal", [
    uintCV(proposalId),
  ]);
}

// ─── arbitration ──────────────────────────────────────────────────────────────

export async function openDispute(
  respondent: string,
  circleId: number,
  description: string,
  evidence: string
): Promise<string> {
  return callContract(CONTRACT_NAMES.ARBITRATION, "open-dispute", [
    principalCV(respondent),
    uintCV(circleId),
    stringUtf8CV(description),
    stringUtf8CV(evidence),
  ]);
}

export async function joinPanel(disputeId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.ARBITRATION, "join-panel", [
    uintCV(disputeId),
  ]);
}

export async function submitVerdict(
  disputeId: number,
  verdict: number,
  reasoning: string
): Promise<string> {
  return callContract(CONTRACT_NAMES.ARBITRATION, "submit-verdict", [
    uintCV(disputeId),
    uintCV(verdict),
    stringUtf8CV(reasoning),
  ]);
}

export async function closeDispute(disputeId: number): Promise<string> {
  return callContract(CONTRACT_NAMES.ARBITRATION, "close-dispute", [
    uintCV(disputeId),
  ]);
}

// ─── synthetic-credit ─────────────────────────────────────────────────────────

export async function mintSCredit(amount: number): Promise<string> {
  return callContract(CONTRACT_NAMES.SYNTHETIC_CREDIT, "mint-scredit", [
    uintCV(amount),
  ]);
}

export async function burnSCredit(amount: number): Promise<string> {
  return callContract(CONTRACT_NAMES.SYNTHETIC_CREDIT, "burn-scredit", [
    uintCV(amount),
  ]);
}

export async function transferSCredit(
  amount: number,
  recipient: string
): Promise<string> {
  return callContract(CONTRACT_NAMES.SYNTHETIC_CREDIT, "transfer-scredit", [
    uintCV(amount),
    principalCV(recipient),
  ]);
}
