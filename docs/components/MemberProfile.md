# MemberProfile

A comprehensive profile panel showing a member's identity, trust tier, savings vault balance, sCREDIT balance, active loans, active ROSCAs, and running tasks — all in one view.

## Import

```tsx
import { MemberProfile } from "@/components/MemberProfile";
```

## Props

No props — reads `address` from `WalletContext`.

## Sections

| Section            | Data source                    |
| ------------------ | ------------------------------ |
| Identity / tier    | `useTrustScore`, `useWallet`   |
| Trust breakdown    | `useTrustScore` (5 components) |
| STX saved          | `useVault(address).balance`    |
| sCREDIT balance    | `useSCredit(address).balance`  |
| Active loans       | `getLoan` read call            |
| Active ROSCAs      | `getRosca` read call           |
| My tasks           | `getTask` read call            |

## Trust Tiers

| Score | Tier     | Accent colour |
| ----- | -------- | ------------- |
| ≥ 900 | Platinum | #a8edea       |
| ≥ 700 | Gold     | #f7931a       |
| ≥ 500 | Silver   | #9ca3af       |
| ≥ 300 | Bronze   | #b45309       |
| < 300 | Starter  | #6b7280       |

## Accessibility

- Outer wrapper: `role="region"`, `aria-label="Member profile for {address}"`.
- Identity card: `role="group"`, `aria-label="Identity and tier"`.
- All progress bars in Trust Breakdown use `role="progressbar"` with `aria-valuenow/min/max`.

## Example

```tsx
import { MemberProfile } from "@/components/MemberProfile";

// In Dashboard or dedicated profile route
<MemberProfile />
```

## Dependencies

- `WalletContext` — `address`, `connected`
- `useTrustScore`, `useVault`, `useSCredit`
- `lib/read`: `getMember`, `getLoan`, `getRosca`, `getTask`, `getTotalCircles`, `getTotalTasks`
- `lib/explorer.explorerAddressUrl`
- `SkeletonCard` — loading state
