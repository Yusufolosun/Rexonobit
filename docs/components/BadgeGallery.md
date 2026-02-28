# BadgeGallery

Displays a member's earned soulbound NFT badges (reputation-nft contract) and an overview of all available achievement badges with locked/unlocked states.

## Import

```tsx
import { BadgeGallery } from "@/components/BadgeGallery";
```

## Props

No props — reads `address` from `WalletContext`.

## Badge Types

| Type | Label           | Trigger                                   |
| ---- | --------------- | ----------------------------------------- |
| 1    | First Save      | First vault deposit                       |
| 2    | Loan Repaid     | Fully repaid a micro-loan                 |
| 3    | Circle Founder  | Created a cooperative circle              |
| 4    | ROSCA Champion  | Completed a full ROSCA cycle              |
| 5    | Labor Star      | Completed 5 on-chain tasks                |
| 6    | Arbitrator      | Served on a dispute panel                 |
| 7    | Governance Hero | Voted on 3+ governance proposals          |

## Features

- **Earned grid**: `role="list"` badge items with animated hover lift.
- **Overview row**: all 7 badge types shown as pills; earned = coloured, unearned = greyed out with 50% opacity.
- **Refresh button**: manually re-fetches from Stacks API; `aria-label="Refresh badge gallery"`.
- **Explorer link**: links to the address on Stacks explorer.
- **Auto-fetch**: runs on mount and address change via `useEffect`.

## Accessibility

- Earned badge grid: `role="list"`, `aria-label="Earned badges"`.
- Badge items: `role="listitem"`, `aria-label="{label} badge — {description}"`.
- All-badges row: `role="list"`, `aria-label="All achievement badges"`.
- Each pill: `role="listitem"`, `aria-label="{label}: earned/not yet earned"`.

## Data Source

Fetches NFT holdings from `STACKS_API_URL/extended/v1/tokens/nft/holdings?principal={address}` and filters for `reputation-nft` asset identifiers.

## Dependencies

- `WalletContext` — `address`, `connected`
- `lib/network.STACKS_API_URL`
- `lib/explorer.explorerAddressUrl`
