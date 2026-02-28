# TaskBoard

**File:** `frontend/src/components/TaskBoard.tsx`

## Purpose

Labor market panel. Members post tasks with STX bounties, bid on open tasks, accept bids, submit work-product CIDs, attest completions, and dispute non-performing workers. Trust scores are updated on attestation.

## Props

None — uses `useWallet()` context internally.

## Key Hooks Used

| Hook | Purpose |
|------|---------|
| `useFormField` × multiple | Task title, description, bounty, CID |
| `useWindowFocus(refresh)` | Re-fetch on tab focus |
| `useContractError` | Error state with auto-dismiss |
| `useMemo(openTasks, closedTasks)` | Split task list by status |

## Transactions

| Action | Contract call |
|--------|---------------|
| Post task | `labor-market.post-task` |
| Bid on task | `labor-market.bid-task` |
| Accept bid | `labor-market.accept-bid` |
| Submit work | `labor-market.submit-work` |
| Attest completion | `labor-market.attest-completion` |
| Dispute task | `labor-market.dispute-task` |
| Cancel task | `labor-market.cancel-task` |

## States

| State | Rendered UI |
|-------|-------------|
| Wallet disconnected | Info card |
| Loading | Skeleton rows |
| Loaded | Open tasks table + closed tasks + post task form |

## Notes

- `openTasks` includes status `"OPEN"` and `"open"` (case-insensitive).
- `closedTasks` includes all non-open statuses.
- Work submission requires an IPFS CID or other content-addressable reference.
