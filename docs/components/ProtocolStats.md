# ProtocolStats

**File:** `frontend/src/components/ProtocolStats.tsx`

## Purpose

Read-only statistics overview component. Displays aggregated protocol metrics fetched from the `protocol-config` contract and individual contract data. No write transactions are initiated from this component.

## Props

None.

## Key Hooks Used

| Hook | Purpose |
|------|---------|
| `useWindowFocus(refresh)` | Background refresh on tab focus |

## Stats Displayed

| Stat Card | Source |
|-----------|--------|
| Total members | `cooperative-registry.get-member-count` |
| Total value locked (STX) | `savings-vault` aggregate |
| Active loans | `lending-pool` aggregate |
| Reputation NFTs minted | `reputation-nft.get-total-supply` |
| Open disputes | `arbitration` aggregate |
| Active ROSCA groups | `rosca` aggregate |

## States

| State | Rendered UI |
|-------|-------------|
| Loading | Skeleton cards (6 × SkeletonCard) |
| Loaded | Grid of stat cards with icon + label + value |

## Notes

- No wallet connection required — all reads are public.
- Refreshes automatically every time the tab regains focus.
- Uses `SkeletonCard` placeholders while data loads to prevent layout shift.
