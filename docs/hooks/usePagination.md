# usePagination

**File:** `frontend/src/hooks/usePagination.ts`

## Purpose

Client-side pagination for arrays. Slices a full data array into fixed-size pages, providing navigation actions and metadata. Use for `TaskBoard`, `TxHistory`, loan lists, and ROSCA group lists.

## Signature

```ts
function usePagination<T>(items: T[], pageSize?: number): PaginationResult<T>
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `items` | `T[]` | — | Full array to paginate |
| `pageSize` | `number` | `10` | Items per page |

## Returns (`PaginationResult<T>`)

| Field | Type | Description |
|-------|------|-------------|
| `page` | `T[]` | Items on the current page |
| `currentPage` | `number` | Current page index (1-based) |
| `totalPages` | `number` | Total number of pages |
| `hasPrev` | `boolean` | Whether a previous page exists |
| `hasNext` | `boolean` | Whether a next page exists |
| `goToPage` | `(p: number) => void` | Navigate to specific page |
| `nextPage` | `() => void` | Advance one page |
| `prevPage` | `() => void` | Go back one page |
| `reset` | `() => void` | Return to page 1 |

## Example

```tsx
const { page, currentPage, totalPages, nextPage, prevPage } = usePagination(tasks, 5);
return (
  <>
    {page.map(t => <TaskCard key={t.id} task={t} />)}
    <button onClick={prevPage} disabled={!hasPrev}>←</button>
    <span>{currentPage}/{totalPages}</span>
    <button onClick={nextPage} disabled={!hasNext}>→</button>
  </>
);
```

## Notes

- `currentPage` is clamped to `[1, totalPages]` by `goToPage`.
- `totalPages` is always at least `1` even for empty arrays.
- All actions are stable `useCallback` references.
