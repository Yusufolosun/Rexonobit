# SCreditPanel

**File:** `frontend/src/components/SCreditPanel.tsx`

## Purpose

Synthetic-credit management panel. Members mint synthetic credit tokens against locked collateral, burn tokens to release collateral, and view their current utilization. Integrates with `synthetic-credit` and `trust-score` contracts.

## Props

None — reads wallet address from context.

## Key Hooks Used

| Hook | Purpose |
|------|---------|
| `useSCredit` | Position data, mint/burn/transfer actions |
| `useFormField` × 2 | Mint amount, burn amount |
| `useContractError` | Error state with auto-dismiss |
| `useWindowFocus(refresh)` | Re-fetch on tab focus |
| `useMemo(minted, available, utilizationPct)` | Derived stats from position |

## Transactions

| Action | Contract call |
|--------|---------------|
| Mint synthetic credit | `synthetic-credit.mint` |
| Burn synthetic credit | `synthetic-credit.burn` |

## Derived Stats (useMemo)

| Stat | Derivation |
|------|-----------|
| `minted` | `position.mintedAmount` |
| `available` | `position.creditCeiling - position.mintedAmount` |
| `utilizationPct` | `(minted / position.creditCeiling) * 100` |

## States

| State | Rendered UI |
|-------|-------------|
| Wallet disconnected | Info card |
| Loading | Skeleton cards |
| Loaded | Credit ceiling, minted, available, utilization bar, mint/burn forms |

## Notes

- Mint is rejected at contract level if `minted + amount > ceiling`.
- Burning more than `mintedAmount` is rejected by the contract.
- Trust score influences the `creditCeiling` assigned by `protocol-config`.
