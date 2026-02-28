# GovernancePanel

**File:** `frontend/src/components/GovernancePanel.tsx`

## Purpose

On-chain governance interface. Members submit trust-weighted proposals (parameter changes, treasury spends, policy updates, member expulsions), vote yes/no, view quorum progress bars, and execute or veto proposals.

## Props

None — uses `useWallet()` context internally.

## Key Hooks Used

| Hook | Purpose |
|------|---------|
| `useFormField` × multiple | Proposal type, title, description, target param |
| `useWindowFocus(refresh)` | Re-fetch on tab focus |
| `useContractError` | Error state with auto-dismiss |
| `useMemo(activeProposals, closedProposals)` | Split proposals by status |

## Transactions

| Action | Contract call |
|--------|---------------|
| Propose | `governance.propose` |
| Vote | `governance.vote` |
| Execute | `governance.execute` |
| Veto | `governance.veto` |

## States

| State | Rendered UI |
|-------|-------------|
| Wallet disconnected | Info card |
| Loading | Skeleton cards |
| Loaded | Active proposals + closed proposals + create form |

## Notes

- Vote weight equals the member's trust score, capped at 20 % of total weight.
- Veto is restricted to the protocol deployer during the bootstrapping phase.
- `activeProposals` filters for status `"ACTIVE"` or `"active"`.
