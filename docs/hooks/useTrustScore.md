# useTrustScore

**File:** `frontend/src/hooks/useTrustScore.ts`

## Purpose

Fetches the full decomposed trust score for a connected Stacks address from the `trust-score` contract. Returns individual contribution components and a derived human-readable tier label.

## Signature

```ts
function useTrustScore(address: string | null): TrustScoreBreakdown
```

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `total` | `number` | Aggregate trust score (0–1000) |
| `savings` | `number` | Points earned from vault deposits and locks |
| `loan` | `number` | Points earned from loan repayments |
| `endorsement` | `number` | Points from peer endorsements |
| `labor` | `number` | Points from completed labor market tasks |
| `penalty` | `number` | Points deducted (disputes lost, defaults) |
| `tier` | `TrustTier` | Derived tier: `"none" \| "bronze" \| "silver" \| "gold" \| "platinum"` |
| `loading` | `boolean` | True while fetching |
| `error` | `string \| null` | Last error, or null |
| `refresh` | `() => void` | Re-fetch all components |

## Tier Thresholds

| Tier | Min Score |
|------|-----------|
| Platinum | 900 |
| Gold | 700 |
| Silver | 500 |
| Bronze | 300 |
| None | < 300 |

## Example

```tsx
const { total, tier, loading } = useTrustScore(address);
// tier === "gold" when total is between 700 and 899
```

## Notes

- Individual component scores sum to `total - penalty`.
- Tier is computed client-side from `total`; it is not stored on-chain.
