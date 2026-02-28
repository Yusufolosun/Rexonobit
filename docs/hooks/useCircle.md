# useCircle

**File:** `frontend/src/hooks/useCircle.ts`

## Purpose

Fetches a single cooperative circle record from the `cooperative-registry` contract by circle ID. Returns circle metadata, admin, member count, and status.

## Signature

```ts
function useCircle(circleId: number | null): UseCircleResult
```

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `circle` | `CircleData \| null` | Circle record, or null |
| `loading` | `boolean` | True while fetching |
| `error` | `string \| null` | Last error, or null |
| `refresh` | `() => void` | Re-fetch circle data |

### `CircleData`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | On-chain circle ID |
| `name` | `string` | Circle name (max 40 chars) |
| `admin` | `string` | Admin/creator principal |
| `memberCount` | `number` | Current number of members |
| `maxSize` | `number` | Maximum allowed members |
| `status` | `number` | 0 = active, 1 = inactive |
| `circleType` | `number` | Circle type code (savings, credit, ROSCA) |
| `totalSaved` | `number` | Cumulative STX saved across all members |
| `createdAt` | `number` | Block height at creation |

## Example

```tsx
const { circle, loading } = useCircle(circleId);
const isFull = circle ? circle.memberCount >= circle.maxSize : false;
```

## Notes

- Pass `null` to skip fetching.
- Use `CircleList` to enumerate active circles; `useCircle` is for single-circle detail views.
