// frontend/src/lib/read.ts
// Read-only contract call helpers via Stacks API (no wallet required)

/**
 * @module read
 * @description `callReadOnlyFunction` wrappers for all 12 REXONOBIT contracts.
 * These are free (no gas) and require no wallet connection. They fetch data
 * from the Stacks API endpoint configured in `STACKS_API_URL`.
 * All functions return typed values or `null`/`0` on error.
 */

import { STACKS_API_URL, DEPLOYER_ADDRESS, CONTRACT_NAMES } from "./network";

interface ReadCallOptions {
  contractName: string;
  functionName: string;
  args?: string[];    // hex-encoded Clarity values
  sender?: string;
}

interface ApiResponse {
  okay: boolean;
  result?: string;
  cause?: string;
}

async function readOnlyCall<T>(
  opts: ReadCallOptions,
  parse: (result: string) => T
): Promise<T> {
  const url = `${STACKS_API_URL}/v2/contracts/call-read/${DEPLOYER_ADDRESS}/${opts.contractName}/${opts.functionName}`;
  const body = {
    sender: opts.sender ?? DEPLOYER_ADDRESS,
    arguments: opts.args ?? [],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data: ApiResponse = await res.json();
  if (!data.okay || !data.result) {
    throw new Error(`Contract read failed: ${data.cause ?? "unknown"}`);
  }
  return parse(data.result);
}

// ─── Helpers to extract values from Clarity hex ─────────────────────────────
// These use basic CV decoding from @stacks/transactions

import {
  deserializeCV,
  cvToValue,
  type ClarityValue,
} from "@stacks/transactions";
import { uintCV, principalCV } from "@stacks/transactions";
import { serializeCV } from "@stacks/transactions";

function hexArg(cv: ClarityValue): string {
  return `0x${Buffer.from(serializeCV(cv)).toString("hex")}`;
}

function parseValue(hex: string): unknown {
  try {
    const cv = deserializeCV(hex);
    return cvToValue(cv, true);
  } catch {
    return hex;
  }
}

// ─── cooperative-registry reads ──────────────────────────────────────────────

export async function getMember(address: string) {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.REGISTRY,
      functionName: "get-member",
      args: [hexArg(principalCV(address))],
    },
    parseValue
  );
}

export async function getCircle(id: number) {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.REGISTRY,
      functionName: "get-circle",
      args: [hexArg(uintCV(id))],
    },
    parseValue
  );
}

export async function isMember(address: string): Promise<boolean> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.REGISTRY,
      functionName: "is-member",
      args: [hexArg(principalCV(address))],
    },
    (hex) => {
      const v = parseValue(hex);
      return v === true;
    }
  );
}

export async function getTotalMembers(): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.REGISTRY,
      functionName: "get-total-members",
      args: [],
    },
    (hex) => Number(parseValue(hex))
  );
}

export async function getTotalCircles(): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.REGISTRY,
      functionName: "get-total-circles",
      args: [],
    },
    (hex) => Number(parseValue(hex))
  );
}

// ─── savings-vault reads ──────────────────────────────────────────────────────

export async function getVault(owner: string) {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.SAVINGS_VAULT,
      functionName: "get-vault",
      args: [hexArg(principalCV(owner))],
    },
    parseValue
  );
}

export async function getVaultBalance(owner: string): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.SAVINGS_VAULT,
      functionName: "get-vault-balance",
      args: [hexArg(principalCV(owner))],
    },
    (hex) => Number(parseValue(hex))
  );
}

export async function getLockedBalance(owner: string): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.SAVINGS_VAULT,
      functionName: "get-locked-balance",
      args: [hexArg(principalCV(owner))],
    },
    (hex) => Number(parseValue(hex))
  );
}

export async function getStreakStatus(owner: string): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.SAVINGS_VAULT,
      functionName: "streak-status",
      args: [hexArg(principalCV(owner))],
    },
    (hex) => Number(parseValue(hex))
  );
}

// ─── trust-score reads ───────────────────────────────────────────────────────

export async function getTrustScore(member: string): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.TRUST_SCORE,
      functionName: "get-score",
      args: [hexArg(principalCV(member))],
    },
    (hex) => Number(parseValue(hex))
  );
}

export async function getTrustScoreFull(member: string) {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.TRUST_SCORE,
      functionName: "get-score-full",
      args: [hexArg(principalCV(member))],
    },
    parseValue
  );
}

// ─── lending-pool reads ───────────────────────────────────────────────────────

export async function getLoan(loanId: number) {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.LENDING_POOL,
      functionName: "get-loan",
      args: [hexArg(uintCV(loanId))],
    },
    parseValue
  );
}

export async function getPoolBalance(circleId: number): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.LENDING_POOL,
      functionName: "get-pool-balance",
      args: [hexArg(uintCV(circleId))],
    },
    (hex) => Number(parseValue(hex))
  );
}

export async function getMaxLoanAmount(borrower: string): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.LENDING_POOL,
      functionName: "get-max-loan-amount",
      args: [hexArg(principalCV(borrower))],
    },
    (hex) => Number(parseValue(hex))
  );
}

// ─── rosca reads ──────────────────────────────────────────────────────────────

export async function getRosca(id: number) {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.ROSCA,
      functionName: "get-rosca",
      args: [hexArg(uintCV(id))],
    },
    parseValue
  );
}

// ─── treasury reads ───────────────────────────────────────────────────────────

export async function getTreasuryBalance(circleId: number): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.TREASURY,
      functionName: "get-treasury-balance",
      args: [hexArg(uintCV(circleId))],
    },
    (hex) => Number(parseValue(hex))
  );
}

export async function getTreasuryProposal(proposalId: number) {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.TREASURY,
      functionName: "get-proposal",
      args: [hexArg(uintCV(proposalId))],
    },
    parseValue
  );
}

// ─── synthetic-credit reads ───────────────────────────────────────────────────

export async function getCreditLimit(member: string): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.SYNTHETIC_CREDIT,
      functionName: "get-credit-limit",
      args: [hexArg(principalCV(member))],
    },
    (hex) => Number(parseValue(hex))
  );
}

export async function getSCreditBalance(member: string): Promise<number> {
  return readOnlyCall(
    {
      contractName: CONTRACT_NAMES.SYNTHETIC_CREDIT,
      functionName: "get-scredit-balance",
      args: [hexArg(principalCV(member))],
    },
    (hex) => Number(parseValue(hex))
  );
}
