# explorer

**File:** `frontend/src/lib/explorer.ts`

## Purpose

Network-aware Stacks Explorer URL generators. Reads `VITE_STACKS_NETWORK` at module initialisation to produce URLs pointing at the correct chain explorer (mainnet, testnet, or local devnet).

## Exports

### `explorerTxUrl(txid: string): string`

Returns a Stacks Explorer URL for a transaction ID.

- Prepends `0x` if absent.
- Appends `?chain=mainnet` or `?chain=testnet` as appropriate.

```ts
explorerTxUrl("abcd1234...") // "https://explorer.hiro.so/txid/0xabcd1234...?chain=testnet"
```

### `explorerAddressUrl(address: string): string`

Returns a Stacks Explorer URL for a principal address.

```ts
explorerAddressUrl("ST1PQHQKV...") // "https://explorer.hiro.so/address/ST1PQHQKV...?chain=testnet"
```

### `explorerBlockUrl(height: number): string`

Returns a Stacks Explorer URL for a block height.

## Network Routing

| `VITE_STACKS_NETWORK` | Base URL |
|-----------------------|---------|
| `mainnet` | `https://explorer.hiro.so` |
| `testnet` (default) | `https://explorer.hiro.so` |
| `devnet` | `http://localhost:3020` |

## Usage

```ts
import { explorerTxUrl } from '../lib/explorer';
const url = explorerTxUrl(txResult.txid);
window.open(url, '_blank');
```

## Notes

- All functions are pure — they do not make network requests.
- Import this module in toast callbacks to provide "View in explorer" links.
