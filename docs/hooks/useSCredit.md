# useSCredit

**File:** `frontend/src/hooks/useSCredit.ts`

## Purpose

Fetches synthetic credit (sCREDIT) state for a connected address. Provides the current sCREDIT balance, the collateral-based credit limit, trust score, and locked savings amount used in the ceiling calculation.

## Signature

```ts
function useSCredit(address: string | null): SCreditState
```

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `balance` | `number` | Current unminted sCREDIT balance |
| `creditLimit` | `number` | Maximum mintable sCREDIT |
| `utilizationPct` | `number` | Percentage of credit limit currently minted |
| `trustScore` | `number` | Current trust score (used in ceiling formula) |
| `lockedSavings` | `number` | Locked vault STX used as collateral (micro-STX) |
| `loading` | `boolean` | True while fetching |
| `error` | `string \| null` | Last error, or null |
| `refresh` | `() => void` | Re-fetch all data |

## Collateral Ceiling Formula

$$
\text{creditLimit} = \text{lockedSTX} \times \frac{\text{trustScore}}{1000} \times C_f
$$

Where $C_f$ is the collateral factor from `protocol-config` (default 0.7).

## Example

```tsx
const { balance, creditLimit, loading } = useSCredit(address);
const available = Math.max(0, creditLimit - balance);
```

## Data Sources

| Field | Read call |
|-------|-----------|
| `balance` | `synthetic-credit.get-balance` |
| `creditLimit` | `synthetic-credit.get-collateral-ceiling` |
| `trustScore` | `trust-score.get-trust-score` |
| `lockedSavings` | `savings-vault.get-locked-balance` |

## Notes

- The `SCreditPosition` type from `lib/types.ts` defines the canonical shape.
- `utilizationPct` is derived client-side in `SCreditPanel` using `useMemo`.
