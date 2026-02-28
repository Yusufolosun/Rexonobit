# protocol-config.clar

## Purpose

Single initialization contract that holds all tuneable protocol parameters. Acts as the source of truth that every other contract reads from. Controlled exclusively by the deployer until ownership is transferred to governance.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `initialize` | public | Set deployer, initial params. Can only be called once. |
| `set-max-loan-amount` | public (owner) | Update maximum allowed loan size in microSTX |
| `set-min-deposit` | public (owner) | Update minimum deposit threshold |
| `set-fee-rate` | public (owner) | Update protocol fee in basis points |
| `set-lock-reward-multiplier` | public (owner) | Update trust score bonus for locked savings |
| `get-max-loan-amount` | read-only | Returns current max loan cap |
| `get-min-deposit` | read-only | Returns current minimum deposit |
| `get-fee-rate` | read-only | Returns current fee rate (bps) |
| `is-initialized` | read-only | Returns `true` once `initialize` has been called |

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u401` | `ERR_UNAUTHORIZED` | Caller is not the contract owner |
| `u402` | `ERR_ALREADY_INITIALIZED` | `initialize` has already been called |

## Security Notes

- `initialize` is guarded against re-entry by a `initialized` data var
- All setter functions check `(is-eq tx-sender (var-get owner))`
- Once governance takes over, owner can be transferred to the multi-sig DAO
