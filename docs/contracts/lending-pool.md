# lending-pool.clar

## Purpose

Circle-backed micro-lending contract. Members of a funded circle can request STX loans against their trust score. Repayment earns additional trust points. Defaulters can be liquidated by circle members after a grace period.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `fund-pool` | public | Deposit STX into a circle's lending pool |
| `request-loan` | public | Request a loan from the pool backed by trust score |
| `repay-loan` | public | Repay an active loan with interest |
| `liquidate-defaulter` | public | Liquidate a member who has not repaid after grace period |
| `get-loan` | read-only | Returns active loan data for an address |
| `get-pool-balance` | read-only | Returns current pool balance for a circle |

## Loan Lifecycle

```
fund-pool → request-loan → [blocks pass] → repay-loan
                                      └──► liquidate-defaulter (after grace period)
```

## Interest Calculation

Interest rate is set in `protocol-config` as basis points per cycle. Calculated at repayment time based on blocks elapsed since loan origination.

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Caller is not a registered member |
| `u403` | `ERR_INSUFFICIENT_BALANCE` | Pool balance too low for requested amount |
| `u406` | `ERR_INVALID_AMOUNT` | Amount exceeds trust-score credit limit |
| `u409` | `ERR_LOAN_ACTIVE` | Member already has an active loan |

## Security Notes

- Loan amounts are capped by the member's trust-score credit limit
- `liquidate-defaulter` is callable by any member after the grace period — no admin key required
- Repayment automatically updates trust score via internal call
