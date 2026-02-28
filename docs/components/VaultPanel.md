# VaultPanel

**File:** `frontend/src/components/VaultPanel.tsx`

## Purpose

Savings vault management panel. Allows connected members to deposit STX, lock savings for a fixed period to earn trust score boosts, and withdraw available or unlocked balances.

## Props

None — uses `useWallet()` context internally.

## Key Hooks Used

| Hook | Purpose |
|------|---------|
| `useVault(address)` | Vault balance, locked balance, streak, lock expiry |
| `useFormField` × 3 | deposit amount, lock amount, lock duration |
| `useWindowFocus(refresh)` | Re-fetch on tab focus |
| `useContractError` | Error state with auto-dismiss |

## Transactions

| Action | Contract call |
|--------|---------------|
| Deposit | `savings-vault.deposit` |
| Lock savings | `savings-vault.lock-savings` |
| Withdraw | `savings-vault.withdraw` |
| Withdraw locked | `savings-vault.withdraw-locked` |

## States

| State | Rendered UI |
|-------|-------------|
| Wallet disconnected | Info card prompting connection |
| Loading | Spinner + "Refreshing…" |
| Loaded | 3 stat cards + action forms |

## Notes

- Lock duration defaults to `2016` blocks (~2 weeks at 10 min/block).
- `streak` is displayed as a counter badge; it increases with each on-time deposit.
- `ErrorAlert` is rendered beneath the heading and auto-dismisses after 6 s.
