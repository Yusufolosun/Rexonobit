# Dashboard

**File:** `frontend/src/components/Dashboard.tsx`

## Purpose

Top-level authenticated layout component. Renders the protocol-wide stats header and provides tab-based navigation routing to all feature panels. Acts as the authenticated root — rendered only after wallet connection from `App.tsx`.

## Props

None — wallet state consumed from context.

## Key Hooks Used

| Hook | Purpose |
|------|---------|
| `useTheme` | Current colour scheme for tab highlight |

## Panel Tabs

| Tab | Component Rendered |
|-----|--------------------|
| Overview | `ProtocolStats` + `TrustScoreCard` + `MemberProfile` |
| Vault | `VaultPanel` |
| Lending | `LoanPanel` |
| ROSCA | `RoscaPanel` |
| Tasks | `TaskBoard` |
| Treasury | `TreasuryPanel` |
| Governance | `GovernancePanel` |
| Disputes | `ArbitrationPanel` |
| S-Credit | `SCreditPanel` |

## States

| State | Rendered UI |
|-------|-------------|
| Tab: Overview | Stats grid + trust + profile |
| Tab: any panel | Full-page panel component |

## Notes

- `ProtocolStats` is always rendered at the top of the Overview tab regardless of wallet state.
- Tab selection is local `useState` — no router dependency.
- `Navbar` and `ThemeToggle` are rendered by `App.tsx` above `Dashboard`, not inside this component.
