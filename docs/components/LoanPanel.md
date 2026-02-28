# LoanPanel

**File:** `frontend/src/components/LoanPanel.tsx`

## Purpose

Micro-lending panel. Members can request STX loans backed by their circle's lending pool, repay outstanding loans, fund pools with STX, and liquidate overdue defaulters.

## Props

None — uses `useWallet()` context internally.

## Key Hooks Used

| Hook | Purpose |
|------|---------|
| `useFormField` × 5 | circleId, request amount, loan ID, repay amount, fund amount |
| `useWindowFocus(refresh)` | Re-fetch on tab focus |
| `useContractError` | Error state with auto-dismiss |
| `useMemo(activePools)` | Derived list of pools with non-zero balances |

## Transactions

| Action | Contract call |
|--------|---------------|
| Request loan | `lending-pool.request-loan` |
| Repay loan | `lending-pool.repay-loan` |
| Liquidate defaulter | `lending-pool.liquidate-defaulter` |
| Fund pool | `lending-pool.fund-pool` |

## States

| State | Rendered UI |
|-------|-------------|
| Wallet disconnected | Info card |
| Loading | 3 skeleton cards |
| Loaded | Active loan card + pool list + action forms |

## Notes

- `activePools` is memoised from the full pool list to avoid re-filtering on every render.
- Liquidation is available to any member once the due block has passed.
