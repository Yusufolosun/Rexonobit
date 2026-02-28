# ArbitrationPanel

**File:** `frontend/src/components/ArbitrationPanel.tsx`

## Purpose

Decentralised dispute resolution panel. Members open disputes against other members, volunteer as arbitrators, submit verdicts, and close resolved disputes. Losing parties receive trust score penalties applied via the `trust-score` contract.

## Props

None — uses `useWallet()` context internally.

## Key Hooks Used

| Hook | Purpose |
|------|---------|
| `useFormField` × multiple | Respondent principal, circle ID, description |
| `useWindowFocus(refresh)` | Re-fetch on tab focus |
| `useContractError` | Error state with auto-dismiss |
| `useMemo(openDisputes, closedDisputes)` | Split dispute list by status |

## Transactions

| Action | Contract call |
|--------|---------------|
| Open dispute | `arbitration.open-dispute` |
| Join panel | `arbitration.join-panel` |
| Submit verdict | `arbitration.submit-verdict` |
| Close dispute | `arbitration.close-dispute` |

## States

| State | Rendered UI |
|-------|-------------|
| Wallet disconnected | Info card |
| Loading | Skeleton cards |
| Loaded | Open disputes + closed disputes + open dispute form |

## Dispute Status Colours

| Status | Colour |
|--------|--------|
| open | green |
| resolved | blue |
| closed | grey |

## Notes

- Initiators and respondents cannot join their own panel.
- `openDisputes` filters for status `"open"`.
- `closedDisputes` shows all other statuses.
