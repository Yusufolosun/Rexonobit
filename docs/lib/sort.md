# sort

Pure, composable sort utilities for protocol domain objects. All functions are **non-mutating** — they return new sorted arrays.

## Import

```ts
import {
  sortByTrustScore,
  sortByDate,
  sortByBlockHeight,
  sortCirclesByBalance,
  sortCirclesByName,
  sortCirclesByMemberCount,
  sortLoansByDueBlock,
  sortLoansByAmount,
} from "@/lib/sort";
```

---

## Generic Sort Order

All functions accept an optional `order` parameter of type `"asc" | "desc"` with a sensible default noted per function.

---

## Trust Score

### `sortByTrustScore<T extends { score: number }>(items, order?)`

Sorts objects with a numeric `score` field. **Default: `"desc"`** (highest score first).

```ts
const ranked = sortByTrustScore(members);         // descending
const ascending = sortByTrustScore(members, "asc");
```

---

## Date / Timestamp

### `sortByDate<T extends { timestamp: string }>(items, order?)`

Sorts objects with an ISO-8601 `timestamp` string. **Default: `"desc"`** (newest first).

```ts
const latest = sortByDate(notifications);
```

### `sortByBlockHeight<T extends { blockHeight: number }>(items, order?)`

Sorts by on-chain `blockHeight`. **Default: `"desc"`** (most recent block first).

---

## Circles

### `sortCirclesByBalance(circles, order?)`

Sorts `CircleSummary[]` by STX balance. **Default: `"desc"`** (richest first).

### `sortCirclesByName(circles, order?)`

Sorts `CircleSummary[]` alphabetically by `name`. **Default: `"asc"`**.

### `sortCirclesByMemberCount(circles, order?)`

Sorts `CircleSummary[]` by `memberCount`. **Default: `"desc"`** (largest first).

#### `CircleSummary` interface

| Field         | Type     |
| ------------- | -------- |
| `circleId`    | `number` |
| `name`        | `string` |
| `balance`     | `number` |
| `memberCount` | `number` |

---

## Loans

### `sortLoansByDueBlock(loans, order?)`

Sorts `LoanSummary[]` by `dueBlock`. **Default: `"asc"`** (most urgent first).

### `sortLoansByAmount(loans, order?)`

Sorts `LoanSummary[]` by `amount`. **Default: `"desc"`** (largest loan first).

#### `LoanSummary` interface

| Field      | Type     |
| ---------- | -------- |
| `loanId`   | `number` |
| `amount`   | `number` |
| `dueBlock` | `number` |
| `status`   | `string` |

---

## Example

```tsx
import { sortCirclesByBalance, sortLoansByDueBlock } from "@/lib/sort";

const topCircles = sortCirclesByBalance(circles).slice(0, 5);
const urgentLoans = sortLoansByDueBlock(loans).slice(0, 3);
```
