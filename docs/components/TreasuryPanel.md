# TreasuryPanel

**File:** `frontend/src/components/TreasuryPanel.tsx`

## Purpose

Circle treasury management panel. Members deposit STX into the shared treasury, propose spending to a specified recipient, vote on proposals, and execute approved ones once quorum is reached.

## Props

None — uses `useWallet()` context internally.

## Key Hooks Used

| Hook | Purpose |
|------|---------|
| `useFormField` × multiple | Circle ID, deposit amount, recipient, spend amount |
| `useWindowFocus(refresh)` | Re-fetch on tab focus |
| `useContractError` | Error state with auto-dismiss |
| `useMemo(pendingProposals, executedProposals)` | Split proposal list by status |

## Transactions

| Action | Contract call |
|--------|---------------|
| Deposit | `treasury.deposit` |
| Propose spend | `treasury.propose-spend` |
| Vote | `treasury.vote-spend` |
| Execute spend | `treasury.execute-spend` |

## States

| State | Rendered UI |
|-------|-------------|
| Wallet disconnected | Info card |
| Loading | Skeleton cards |
| Loaded | Balance card + pending proposals + executed proposals + forms |

## Notes

- `pendingProposals` shows status `"pending"` or `"active"`.
- `executedProposals` shows status `"executed"`.
- Quorum threshold is governed by `protocol-config.clar`.
