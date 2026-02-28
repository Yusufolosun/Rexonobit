# TrustScoreCard

Displays a member's on-chain trust score with a full breakdown of the five scoring components, tier badge, and animated progress bars.

## Import

```tsx
import TrustScoreCard from "@/components/TrustScoreCard";
```

## Props

| Prop      | Type     | Required | Description                            |
| --------- | -------- | -------- | -------------------------------------- |
| `address` | `string` | Yes      | Stacks principal address to query      |

## Displayed Data

| Metric        | Source hook                    |
| ------------- | ------------------------------ |
| Total score   | `useTrustScore(address).total` |
| Savings       | `useTrustScore(address).savings` |
| Loan repay    | `useTrustScore(address).loan`  |
| Endorsements  | `useTrustScore(address).endorsement` |
| Labor         | `useTrustScore(address).labor` |
| Penalties     | `useTrustScore(address).penalty` |

## Tier Labels

| Score | Tier     |
| ----- | -------- |
| ≥ 900 | Platinum |
| ≥ 700 | Gold     |
| ≥ 500 | Silver   |
| ≥ 300 | Bronze   |
| < 300 | Starter  |

## Accessibility

- Score bars use `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label="{component}: {value} of 1000"`.
- Loading state renders `<SkeletonCard aria-busy="true">`.

## Example

```tsx
import TrustScoreCard from "@/components/TrustScoreCard";

<TrustScoreCard address={connectedAddress} />
```

## Dependencies

- `useTrustScore` — reads trust score data from `trust-score` contract
- `SkeletonCard` — loading placeholder
