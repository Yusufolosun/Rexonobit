// frontend/src/lib/explorer.ts
// Stacks Explorer URL helpers — mainnet and testnet aware

const NETWORK_TYPE = (import.meta.env.VITE_STACKS_NETWORK || "testnet") as string;

const EXPLORER_BASE =
  NETWORK_TYPE === "mainnet"
    ? "https://explorer.hiro.so"
    : NETWORK_TYPE === "devnet"
    ? "http://localhost:3020"
    : "https://explorer.hiro.so";

const NETWORK_PARAM = NETWORK_TYPE === "mainnet" ? "mainnet" : "testnet";

/**
 * Returns a Stacks Explorer URL for a given transaction ID.
 */
export function explorerTxUrl(txid: string): string {
  const id = txid.startsWith("0x") ? txid : `0x${txid}`;
  return `${EXPLORER_BASE}/txid/${id}?chain=${NETWORK_PARAM}`;
}

/**
 * Returns a Stacks Explorer URL for a given principal address.
 */
export function explorerAddressUrl(address: string): string {
  return `${EXPLORER_BASE}/address/${address}?chain=${NETWORK_PARAM}`;
}

/**
 * Returns a Stacks Explorer URL for a given contract (address.contract-name).
 */
export function explorerContractUrl(address: string, contractName: string): string {
  return `${EXPLORER_BASE}/txid/${address}.${contractName}?chain=${NETWORK_PARAM}`;
}
