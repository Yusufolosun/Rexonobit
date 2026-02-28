# useVault

**File:** `frontend/src/hooks/useVault.ts`

## Purpose

Fetches and manages savings vault state for a connected Stacks address. Exposes balance, locked balance, lock expiry height, and streak count. Extends the canonical `VaultData` interface from `lib/types.ts`.

## Signature

```ts
function useVault(address: string | null): VaultState
```

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `balance` | `number` | Available (unlocked) vault balance in micro-STX |
| `lockedBalance` | `number` | STX currently locked as collateral in micro-STX |
| `lockedUntil` | `number` | Block height at which the lock expires (0 if none) |
| `streak` | `number` | Number of consecutive deposit streak periods completed |
| `loading` | `boolean` | True while fetching data |
| `error` | `string \| null` | Last fetch error message, or null |
| `refresh` | `() => void` | Manually re-fetch all vault data |

## Example

```tsx
const { balance, lockedBalance, streak, loading, refresh } = useVault(address);
useWindowFocus(refresh);
```

## Data Sources

| Field | Contract read call |
|-------|--------------------|
| `balance` | `savings-vault.get-balance` |
| `lockedBalance` | `savings-vault.get-locked-balance` |
| `lockedUntil` | `savings-vault.get-locked-until` |
| `streak` | `savings-vault.get-streak-status` |

## Notes

- Returns zero values when `address` is null (wallet disconnected).
- All amounts are in micro-STX (1 STX = 1,000,000 micro-STX).
- Use `microstxToStx()` from `lib/constants.ts` for display formatting.
