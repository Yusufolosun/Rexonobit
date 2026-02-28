# math

**File:** `frontend/src/lib/math.ts`

## Purpose

Pure arithmetic helpers for protocol financial calculations. Operates on integer microSTX to avoid floating-point rounding errors in lending, utilization, and trust score computations.

## Exports

### `toMicroSTX(stx: number | string): number`

Converts STX to microSTX integer.

```ts
toMicroSTX(5)     // 5_000_000
toMicroSTX("2.5") // 2_500_000
```

### `fromMicroSTX(microSTX: number): number`

Converts microSTX to STX float.

```ts
fromMicroSTX(5_000_000) // 5
```

### `calcSimpleInterest(principal, rateBps, periods?): number`

Calculates simple interest in microSTX.

| Parameter | Type | Description |
|-----------|------|-------------|
| `principal` | `number` | Principal in microSTX |
| `rateBps` | `number` | Rate in basis points (500 = 5%) |
| `periods` | `number` | Number of periods (default 1) |

```ts
calcSimpleInterest(1_000_000, 500) // 50_000 (5% of 1 STX)
```

### `calcRepaymentTotal(principal, rateBps, periods?): number`

Returns `principal + interest`.

### `calcUtilization(used: number, ceiling: number): number`

Returns utilization as percentage (0–100). Safe division by zero.

```ts
calcUtilization(400_000, 1_000_000) // 40
calcUtilization(0, 0)               // 0
```

### `calcTrustContribution(value, maxValue, weight): number`

Proportional trust score contribution.

```ts
calcTrustContribution(5, 10, 400) // 200 (50% of 400-point weight)
```

### `sum(values: number[]): number`

Array sum.

### `clamp(value, min, max): number`

Constrains a value to a range.

## Usage

```ts
import { toMicroSTX, calcRepaymentTotal } from '../lib/math';

const amount = toMicroSTX(loanField.value);
const repayment = calcRepaymentTotal(amount, pool.interestRate);
```

## Notes

- All functions return integers where applicable (`Math.floor`).
- `calcUtilization` caps at 100 — does not exceed ceiling by design.
