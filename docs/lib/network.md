# network

**File:** `frontend/src/lib/network.ts`

## Purpose

Stacks network configuration using `@stacks/network`. Provides a pre-configured network instance and contract address helpers consumed by `read.ts`, `transactions.ts`, and `wallet.ts`.

## Exports

### `STACKS_API_URL: string`

Base URL for Stacks API calls. Defaults to `https://api.testnet.hiro.so`. Override with `VITE_STACKS_API_URL` env var.

### `DEPLOYER_ADDRESS: string`

The principal that deployed all REXONOBIT contracts. Must be set via `VITE_DEPLOYER_ADDRESS` env var. No default — missing value throws at runtime.

### `network`

Pre-constructed `StacksMainnet | StacksTestnet | StacksDevnet` instance for the active environment.

### `getNetwork(): StacksMainnet | StacksTestnet | StacksDevnet`

Factory function returning a fresh network instance. Prefer importing the `network` singleton unless you need an isolated instance.

### `contractId(name: ContractName): string`

Returns the fully qualified contract identifier: `${DEPLOYER_ADDRESS}.${name}`

```ts
contractId(CONTRACT_NAMES.savingsVault) // "ST1PQHQ....savings-vault"
```

## Environment Variables

| Variable | Default | Required |
|----------|---------|---------|
| `VITE_STACKS_NETWORK` | `testnet` | No |
| `VITE_STACKS_API_URL` | `https://api.testnet.hiro.so` | No |
| `VITE_DEPLOYER_ADDRESS` | — | **Yes** |

## Usage

```ts
import { network, contractId } from '../lib/network';
import { CONTRACT_NAMES } from '../lib/constants';
const id = contractId(CONTRACT_NAMES.governance); // "ST1PQ....governance"
```

## Notes

- Set `VITE_DEPLOYER_ADDRESS` in `.env.testnet` and `.env.mainnet` — it changes per deployment.
- `@stacks/network` classes configure the API base URL and chain ID automatically.
