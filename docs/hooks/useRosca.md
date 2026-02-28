# useRosca

**File:** `frontend/src/hooks/useRosca.ts`

## Purpose

Fetches a single ROSCA (Rotating Savings and Credit Association) record from the `rosca` contract by ROSCA ID. Exposes group configuration, cycle progress, and current status.

## Signature

```ts
function useRosca(roscaId: number | null): UseRoscaResult
```

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `rosca` | `RoscaData \| null` | ROSCA record, or null |
| `loading` | `boolean` | True while fetching |
| `error` | `string \| null` | Last error, or null |
| `refresh` | `() => void` | Re-fetch data |

### `RoscaData`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | On-chain ROSCA ID |
| `circleId` | `number` | Parent circle |
| `contributionAmount` | `number` | Required contribution per cycle in micro-STX |
| `cycleLengthBlocks` | `number` | Length of each cycle in blocks |
| `currentCycle` | `number` | Current active cycle index |
| `totalCycles` | `number` | Total number of cycles (= member count) |
| `status` | `number` | Numeric status code |
| `currentPot` | `number` | STX accumulated in current cycle |
| `startBlock` | `number` | Block at which the ROSCA started |
| `payoutOrder` | `string[]` | Ordered list of member principals for payout |

## Example

```tsx
const { rosca, loading } = useRosca(roscaId);
const progress = rosca ? rosca.currentCycle / rosca.totalCycles : 0;
```

## Notes

- `RoscaStatus` type is imported from `lib/types.ts` for status display.
- Pass `null` to disable fetching.
