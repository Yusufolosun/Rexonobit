# constants

**File:** `frontend/src/lib/constants.ts`

## Purpose

Protocol-wide compile-time constants shared across all hooks, components, and lib utilities. Centralising these values means a single change propagates everywhere without a search-and-replace across the codebase.

## Exports

### `CONTRACT_NAMES`

```ts
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
```

**Keep in sync with `Clarinet.toml` contract names.**

### `ContractName`

Derived union type: `"protocol-config" | "cooperative-registry" | ...`

### Numeric constants

| Constant | Value | Used for |
|----------|-------|---------|
| `MICROSTX_PER_STX` | `1_000_000` | STX ↔ microSTX conversion |
| `TRUST_SCORE_TIERS` | `{ bronze:300, silver:500, gold:700, platinum:900 }` | Tier thresholds |
| `DEFAULT_PAGE_SIZE` | `20` | Pagination default |
| `POLL_INTERVAL_MS` | `30_000` | Background polling cadence |

## Usage

```ts
import { CONTRACT_NAMES, MICROSTX_PER_STX } from '../lib/constants';
const name = CONTRACT_NAMES.savingsVault; // "savings-vault"
const ustx = 5 * MICROSTX_PER_STX;       // 5_000_000
```

## Notes

- `CONTRACT_NAMES` is `as const` — the type is the literal string, not `string`.
- Never hardcode contract name strings in components; always import from here.
