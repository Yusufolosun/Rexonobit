# useLoan

**File:** `frontend/src/hooks/useLoan.ts`

## Purpose

Fetches a single loan record from the `lending-pool` contract by loan ID. Exposes loan metadata, borrower, amount, due block, and repayment status.

## Signature

```ts
function useLoan(loanId: number | null): UseLoanResult
```

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `loan` | `LoanData \| null` | Loan record, or null if not found or not loaded |
| `loading` | `boolean` | True while fetching |
| `error` | `string \| null` | Last error, or null |
| `refresh` | `() => void` | Re-fetch loan data |

### `LoanData`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | On-chain loan ID |
| `borrower` | `string` | Borrower principal |
| `circleId` | `number` | Circle that backed the loan |
| `amount` | `number` | Loan principal in micro-STX |
| `repaid` | `number` | Amount repaid so far in micro-STX |
| `dueBlock` | `number` | Repayment due block height |
| `status` | `number` | Numeric status code (0=active, 1=repaid, 2=defaulted) |
| `statusLabel` | `LoanStatus \| "unknown"` | Human-readable status |

## Example

```tsx
const { loan, loading } = useLoan(selectedLoanId);
const overdue = loan && currentBlock > loan.dueBlock && loan.status === 0;
```

## Notes

- Pass `null` as `loanId` to skip fetching (no-op state).
- The `LoanStatus` type is imported from `lib/types.ts`.
