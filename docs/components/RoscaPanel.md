# RoscaPanel

**File:** `frontend/src/components/RoscaPanel.tsx`

## Purpose

ROSCA (Rotating Savings and Credit Association) panel. Members create, join, and manage on-chain Susu/Tontine/Chit-Fund groups. Handles contributions, payout ordering, cycle advancement, and lock/start actions.

## Props

None — uses `useWallet()` context internally.

## Key Hooks Used

| Hook | Purpose |
|------|---------|
| `useFormField` × multiple | Group name, contribution amount, cycle length, payout order |
| `useWindowFocus(refresh)` | Re-fetch on tab focus |
| `useContractError` | Error state with auto-dismiss |
| `useMemo(activeRoscas, completedRoscas)` | Split ROSCA list by status |

## Transactions

| Action | Contract call |
|--------|---------------|
| Create ROSCA | `rosca.create-rosca` |
| Join ROSCA | `rosca.join-rosca` |
| Lock & start | `rosca.lock-and-start-rosca` |
| Contribute | `rosca.contribute` |
| Set payout order | `rosca.set-payout-order` |
| Trigger payout | `rosca.trigger-payout` |

## States

| State | Rendered UI |
|-------|-------------|
| Wallet disconnected | Info card |
| Loading | Skeleton cards |
| Loaded | Active groups list + completed groups + action forms |

## Notes

- `activeRoscas` filters for status `"open"` or `"active"`.
- `completedRoscas` filters for status `"complete"` or `"closed"`.
- The payout order must be set before the ROSCA can be locked and started.
