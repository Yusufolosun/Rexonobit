# useTask

**File:** `frontend/src/hooks/useTask.ts`

## Purpose

Fetches a single labor market task from the `labor-market` contract by task ID. Returns task metadata, bounty amount, assignment status, and attestation count.

## Signature

```ts
function useTask(taskId: number | null): UseTaskResult
```

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `task` | `TaskData \| null` | Task record, or null |
| `loading` | `boolean` | True while fetching |
| `error` | `string \| null` | Last error, or null |
| `refresh` | `() => void` | Re-fetch task data |

### `TaskData`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | On-chain task ID |
| `poster` | `string` | Task poster principal |
| `worker` | `string \| null` | Assigned worker, or null if open |
| `title` | `string` | Short task title |
| `description` | `string` | Detailed task description |
| `bounty` | `number` | Bounty amount in micro-STX |
| `status` | `number` | Numeric status code |
| `circleId` | `number` | Circle scope of the task |
| `attestations` | `number` | Number of completion attestations received |
| `postedAt` | `number` | Block height at which task was posted |

## Example

```tsx
const { task, loading } = useTask(selectedTaskId);
const isComplete = task?.status === 4; // COMPLETE
```

## Notes

- `TaskStatus` type from `lib/types.ts` maps status codes to string labels.
- Pass `null` as `taskId` to skip fetching.
