# Loan Mechanics

## Overview

The `lending-pool` contract implements **circle-backed micro-lending**. Members borrow from a shared STX pool funded by fellow circle members. Loan capacity is trust-score gated. A fixed **contribution fee** (not compound interest) is added to the due amount at repayment and returned to the pool.

---

## Lifecycle

```
fund-pool (depositor)
    └─► request-loan (borrower)
            └─► [approval — automatic if trust check passes]
                    └─► repay-loan (borrower)
                    │       └─► trust-score: reward-loan-repay
                    │
                    └─► liquidate-loan (circle lead, after due-at)
                            └─► trust-score: apply-penalty (borrower + endorsers)
```

---

## Pool Funding

Any registered circle member can call `fund-pool(circle-id, amount)` to deposit STX into the circle's lending pool. Deposits are tracked per circle in the `circle-pools` map:

| Field          | Description                          |
| -------------- | ------------------------------------ |
| `balance`      | Currently available STX (micro-STX)  |
| `total-lent`   | Cumulative amount lent out           |
| `total-repaid` | Cumulative amount repaid             |
| `total-fees`   | Cumulative fees collected            |
| `loan-count`   | Number of loans issued               |

---

## Loan Eligibility

A borrower's maximum loan amount is:

$$
\text{max\_loan} = \text{trust\_score} \times \text{loan-max-multiplier}
$$

Where `loan-max-multiplier` is set in `protocol-config` (default configurable per deployment). The pool must have sufficient `balance` to cover the requested amount plus fee.

Additional checks:
- Borrower must be a registered circle member
- Borrower must not have an existing active loan in the same circle
- Requested amount must be > 0

---

## Fee Calculation

The contribution fee is a flat percentage:

$$
\text{fee} = \text{amount} \times \frac{\text{loan-fee-bps}}{10000}
$$

`loan-fee-bps` (basis points) is read from `protocol-config`. The fee is deducted at repayment time (not at disbursement), so the borrower receives the full `amount` but repays `amount + fee`.

---

## Repayment

`repay-loan(loan-id, repayment-amount)`:
- `repayment-amount` must be ≥ `total-due`
- STX transferred from borrower to contract
- Pool `balance` += full repayment
- Pool `total-repaid` += repayment amount; `total-fees` += fee component
- Loan `status` → `REPAID (u3)`
- Loan `repaid-at` set to current `block-height`
- `trust-score.reward-loan-repay` called to reward borrower

---

## Liquidation (Default)

If the borrower has not repaid by `due-at` (block height), any circle member can call `liquidate-loan(loan-id, borrower)`:
- Loan status → `DEFAULTED (u4)`
- `trust-score.apply-penalty` applied to borrower and their endorsers (**joint-liability**)
- Pool `balance` is **not** restored (the collateral mechanism is social — trust score impact)

---

## Loan Status Constants

| Constant                | Value | Meaning              |
| ----------------------- | ----- | -------------------- |
| `LOAN-STATUS-PENDING`   | `u1`  | Awaiting approval    |
| `LOAN-STATUS-ACTIVE`    | `u2`  | Disbursed, repayable |
| `LOAN-STATUS-REPAID`    | `u3`  | Fully repaid         |
| `LOAN-STATUS-DEFAULTED` | `u4`  | Liquidated / defaulted |

---

## Loan Record Fields

| Field           | Type       | Description                              |
| --------------- | ---------- | ---------------------------------------- |
| `borrower`      | `principal`| Borrower address                         |
| `circle-id`     | `uint`     | Circle the loan was drawn from           |
| `amount`        | `uint`     | Principal in micro-STX                   |
| `fee`           | `uint`     | Contribution fee in micro-STX            |
| `total-due`     | `uint`     | `amount + fee`                           |
| `amount-repaid` | `uint`     | Cumulative repayments received           |
| `status`        | `uint`     | See status constants above               |
| `approved-at`   | `uint`     | Block height of approval                 |
| `due-at`        | `uint`     | Block height after which liquidation is allowed |
| `repaid-at`     | `uint`     | Block height of full repayment (0 if not repaid) |
| `created-at`    | `uint`     | Block height of loan request             |

---

## Frontend Integration

The `useLoan` hook reads loan data via `get-loan` and `get-active-loan`:

```ts
const { loan, pool, loading, requestLoan, repayLoan, fundPool, liquidate } = useLoan(circleId);
```

All write functions use `doContractCall` from `@stacks/connect` and emit `loading` state via `useAsyncCallback`.
