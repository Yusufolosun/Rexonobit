# savings-vault.clar

## Purpose

On-chain savings vault where members deposit STX (Bitcoin-backed via Stacks). Supports unlocked and time-locked savings. Locked savings earn bonus trust score points and serve as collateral for synthetic credit lines.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `deposit` | public | Deposit STX into the member's vault |
| `lock-savings` | public | Lock a portion of savings for a specified block duration |
| `withdraw` | public | Withdraw all available (unlocked) STX |
| `withdraw-locked` | public | Withdraw locked savings after lock expiry |
| `get-vault-balance` | read-only | Returns unlocked vault balance for an address |
| `get-locked-balance` | read-only | Returns locked savings balance |
| `get-locked-until` | read-only | Returns the block height when lock expires |
| `get-streak-status` | read-only | Returns consecutive-deposit streak count |

## Savings Streak

A streak increments on each deposit made within the configured cycle window. Sustained streaks multiply trust score savings points.

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Caller is not a registered member |
| `u403` | `ERR_INSUFFICIENT_BALANCE` | Insufficient vault balance for the operation |
| `u404` | `ERR_TOO_EARLY` | Lock has not expired yet (for `withdraw-locked`) |
| `u406` | `ERR_INVALID_AMOUNT` | Amount is zero or below minimum deposit |

## Security Notes

- `withdraw-locked` checks block height against `lock-until` — cannot be called early
- Deposits update trust score via an internal call to `trust-score.clar`
- No admin drain function exists; only the member can withdraw their own savings
