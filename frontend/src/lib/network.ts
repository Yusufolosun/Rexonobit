// frontend/src/lib/network.ts
// Stacks network configuration using @stacks/network

/**
 * @module network
 * @description Stacks network configuration and contract address helpers.
 * The active network is controlled by the `VITE_STACKS_NETWORK` environment
 * variable (mainnet | testnet | devnet). Defaults to testnet.
 */

import {
  STACKS_MAINNET,
  STACKS_TESTNET,
  STACKS_DEVNET,
  type StacksNetwork,
} from "@stacks/network";

type NetworkType = "mainnet" | "testnet" | "devnet";

const NETWORK_TYPE = (import.meta.env.VITE_STACKS_NETWORK ||
  "testnet") as NetworkType;

export const STACKS_API_URL =
  import.meta.env.VITE_STACKS_API_URL || "https://api.testnet.hiro.so";

/**
 * Returns a Stacks network object for the currently configured environment.
 * The `client.baseUrl` is overridden from the VITE_STACKS_API_URL env var.
 * @returns StacksNetwork
 */
export function getNetwork(): StacksNetwork {
  switch (NETWORK_TYPE) {
    case "mainnet":
      return { ...STACKS_MAINNET, client: { baseUrl: STACKS_API_URL } };
    case "devnet":
      return { ...STACKS_DEVNET, client: { baseUrl: "http://localhost:3999" } };
    default:
      return { ...STACKS_TESTNET, client: { baseUrl: STACKS_API_URL } };
  }
}

export const network = getNetwork();

export const DEPLOYER_ADDRESS =
  import.meta.env.VITE_DEPLOYER_ADDRESS ||
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

export const CONTRACT_NAMES = {
  REGISTRY: import.meta.env.VITE_CONTRACT_REGISTRY || "cooperative-registry",
  SAVINGS_VAULT:
    import.meta.env.VITE_CONTRACT_SAVINGS_VAULT || "savings-vault",
  TRUST_SCORE:
    import.meta.env.VITE_CONTRACT_TRUST_SCORE || "trust-score",
  LENDING_POOL:
    import.meta.env.VITE_CONTRACT_LENDING_POOL || "lending-pool",
  LABOR_MARKET:
    import.meta.env.VITE_CONTRACT_LABOR_MARKET || "labor-market",
  TREASURY: import.meta.env.VITE_CONTRACT_TREASURY || "treasury",
  GOVERNANCE: import.meta.env.VITE_CONTRACT_GOVERNANCE || "governance",
  ROSCA: import.meta.env.VITE_CONTRACT_ROSCA || "rosca",
  REPUTATION_NFT:
    import.meta.env.VITE_CONTRACT_REPUTATION_NFT || "reputation-nft",
  ARBITRATION:
    import.meta.env.VITE_CONTRACT_ARBITRATION || "arbitration",
  SYNTHETIC_CREDIT:
    import.meta.env.VITE_CONTRACT_SYNTHETIC_CREDIT || "synthetic-credit",
  PROTOCOL_CONFIG:
    import.meta.env.VITE_CONTRACT_PROTOCOL_CONFIG || "protocol-config",
} as const;

export type ContractKey = keyof typeof CONTRACT_NAMES;

export function contractId(name: ContractKey): string {
  return `${DEPLOYER_ADDRESS}.${CONTRACT_NAMES[name]}`;
}
