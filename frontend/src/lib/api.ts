/**
 * lib/api.ts
 *
 * Typed helpers for the Stacks Blockchain API.
 * All functions accept a base URL so callers can swap mainnet / testnet / devnet
 * without touching application code.
 *
 * Security notes:
 * - No credentials stored here; all requests are unauthenticated read-only.
 * - Broadcast transactions must be signed client-side via @stacks/connect before
 *   calling broadcastTx.
 * - Always validate responses before trusting numeric fields.
 */

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export interface StacksAccountInfo {
  balance: string;         // STX balance in uSTX (decimal string)
  locked: string;          // Locked STX in uSTX (decimal string)
  unlock_height: number;
  nonce: number;
  balance_proof: string;
  nonce_proof: string;
}

export interface StacksBlock {
  canonical: boolean;
  height: number;
  hash: string;
  block_time: number;
  block_time_iso: string;
  index_block_hash: string;
  parent_block_hash: string;
  txs: string[];
}

export interface StacksTransaction {
  tx_id: string;
  tx_status: "success" | "abort_by_response" | "abort_by_post_condition" | "pending" | string;
  tx_type: string;
  block_height: number;
  block_time: number;
  fee_rate: string;
  sender_address: string;
}

export interface ReadOnlyResult {
  okay: boolean;
  result: string;   // Clarity value as hex or "(ok …)" string
}

export interface BroadcastResponse {
  txid: string;
  error?: string;
  reason?: string;
}

// -------------------------------------------------------
// Core fetch helper (no credentials, read-only)
// -------------------------------------------------------

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// -------------------------------------------------------
// Account
// -------------------------------------------------------

/**
 * Fetch STX balance and nonce for a principal.
 *
 * @example
 * const info = await getAccountInfo(baseUrl, "ST1ABC…");
 * const balanceStx = Number(info.balance) / 1_000_000;
 */
export async function getAccountInfo(
  baseUrl: string,
  principal: string
): Promise<StacksAccountInfo> {
  return apiFetch<StacksAccountInfo>(
    `${baseUrl}/v2/accounts/${encodeURIComponent(principal)}?proof=0`
  );
}

// -------------------------------------------------------
// Blocks
// -------------------------------------------------------

/**
 * Fetch a block by height or hash.
 */
export async function getBlock(
  baseUrl: string,
  heightOrHash: number | string
): Promise<StacksBlock> {
  return apiFetch<StacksBlock>(
    `${baseUrl}/extended/v1/block/${encodeURIComponent(String(heightOrHash))}`
  );
}

/**
 * Fetch the latest/current block.
 */
export async function getLatestBlock(baseUrl: string): Promise<StacksBlock> {
  const res = await apiFetch<{ results: StacksBlock[] }>(
    `${baseUrl}/extended/v1/block?limit=1`
  );
  if (!res.results?.[0]) throw new Error("No blocks returned");
  return res.results[0];
}

// -------------------------------------------------------
// Transactions
// -------------------------------------------------------

/**
 * Fetch a transaction by ID.
 */
export async function getTx(
  baseUrl: string,
  txId: string
): Promise<StacksTransaction> {
  return apiFetch<StacksTransaction>(
    `${baseUrl}/extended/v1/tx/${encodeURIComponent(txId)}`
  );
}

/**
 * List recent transactions for an address.
 */
export async function getAddressTransactions(
  baseUrl: string,
  address: string,
  limit = 20,
  offset = 0
): Promise<{ total: number; results: StacksTransaction[] }> {
  return apiFetch<{ total: number; results: StacksTransaction[] }>(
    `${baseUrl}/extended/v1/address/${encodeURIComponent(address)}/transactions?limit=${limit}&offset=${offset}`
  );
}

// -------------------------------------------------------
// Smart Contract — Read-Only
// -------------------------------------------------------

/**
 * Call a read-only Clarity function.
 *
 * @param contractAddress  - Principal that deployed the contract
 * @param contractName     - Contract name (without .clar extension)
 * @param functionName     - Public read-only function name
 * @param functionArgs     - Hex-encoded Clarity argument array
 * @param senderAddress    - Principal to simulate the call as
 */
export async function callReadOnlyFn(
  baseUrl: string,
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: string[] = [],
  senderAddress: string
): Promise<ReadOnlyResult> {
  return apiFetch<ReadOnlyResult>(
    `${baseUrl}/v2/contracts/call-read/${encodeURIComponent(contractAddress)}/${encodeURIComponent(contractName)}/${encodeURIComponent(functionName)}`,
    {
      method: "POST",
      body: JSON.stringify({ sender: senderAddress, arguments: functionArgs }),
    }
  );
}

// -------------------------------------------------------
// Broadcast
// -------------------------------------------------------

/**
 * Broadcast a serialised, signed Stacks transaction.
 *
 * The caller is responsible for signing the transaction with @stacks/transactions
 * before passing the hex-encoded bytes here.
 *
 * @param rawTxHex - Hex-encoded signed transaction bytes
 */
export async function broadcastTx(
  baseUrl: string,
  rawTxHex: string
): Promise<BroadcastResponse> {
  return apiFetch<BroadcastResponse>(`${baseUrl}/v2/transactions`, {
    method: "POST",
    body: JSON.stringify({ tx: rawTxHex }),
  });
}

// -------------------------------------------------------
// Node info
// -------------------------------------------------------

export interface NodeInfo {
  peer_version: number;
  pox_consensus: string;
  burn_block_height: number;
  stable_pox_consensus: string;
  stacks_tip_height: number;
  stacks_tip: string;
  server_version: string;
  network_id: number;
}

/**
 * Fetch current Stacks node info including chain tip height.
 */
export async function getNodeInfo(baseUrl: string): Promise<NodeInfo> {
  return apiFetch<NodeInfo>(`${baseUrl}/v2/info`);
}
