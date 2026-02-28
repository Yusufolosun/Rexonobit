# api

**Location:** `frontend/src/lib/api.ts`

Typed fetch wrappers for the Stacks Blockchain API. All calls are unauthenticated and read-only except `broadcastTx` which submits a pre-signed transaction.

---

## Functions

### `getAccountInfo(baseUrl, principal)`

Returns STX balance, locked amount, and nonce for a principal.

```ts
const info = await getAccountInfo(baseUrl, "ST1ABC…");
const stxBalance = Number(info.balance) / 1_000_000;
```

**Returns:** `StacksAccountInfo`

---

### `getBlock(baseUrl, heightOrHash)`

Fetches a block by height (number) or block hash (string).

```ts
const block = await getBlock(baseUrl, 120000);
```

**Returns:** `StacksBlock`

---

### `getLatestBlock(baseUrl)`

Fetches the most recent block.

```ts
const tip = await getLatestBlock(baseUrl);
console.log(tip.height);
```

**Returns:** `StacksBlock`

---

### `getTx(baseUrl, txId)`

Fetches a single transaction by ID.

```ts
const tx = await getTx(baseUrl, "0x1234…");
console.log(tx.tx_status);   // "success" | "pending" | …
```

**Returns:** `StacksTransaction`

---

### `getAddressTransactions(baseUrl, address, limit?, offset?)`

Lists recent transactions for an address with pagination.

```ts
const { total, results } = await getAddressTransactions(baseUrl, address, 10, 0);
```

**Returns:** `{ total: number; results: StacksTransaction[] }`

---

### `callReadOnlyFn(baseUrl, contractAddress, contractName, functionName, functionArgs, senderAddress)`

Calls a Clarity read-only function via the `/v2/contracts/call-read` endpoint.

```ts
const res = await callReadOnlyFn(
  baseUrl,
  "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "trust-score",
  "get-score",
  [cvToHex(principalCV(userAddress))],
  userAddress
);
```

**Returns:** `ReadOnlyResult { okay: boolean; result: string }`

---

### `broadcastTx(baseUrl, rawTxHex)`

Broadcasts a signed transaction. Caller must sign with `@stacks/transactions` first.

```ts
import { makeSTXTokenTransfer, broadcastTransaction } from "@stacks/transactions";
// … build and sign tx …
const res = await broadcastTx(baseUrl, signedTxHex);
console.log(res.txid);
```

**Returns:** `BroadcastResponse { txid: string; error?: string }`

---

### `getNodeInfo(baseUrl)`

Fetches Stacks node metadata including current chain tip height.

```ts
const info = await getNodeInfo(baseUrl);
const currentHeight = info.stacks_tip_height;
```

**Returns:** `NodeInfo`

---

## Base URLs

| Network | URL |
|---------|-----|
| Mainnet | `https://api.mainnet.hiro.so` |
| Testnet | `https://api.testnet.hiro.so` |
| Devnet | `http://localhost:3999` |

---

## Error Handling

All functions throw an `Error` when the API responds with a non-2xx status code. The error message includes the HTTP status code and response body.

```ts
try {
  const info = await getAccountInfo(baseUrl, address);
} catch (err) {
  console.error("API error:", err.message);
}
```
