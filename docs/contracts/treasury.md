# treasury.clar

## Purpose

Circle treasury contract. Members deposit STX into a shared pool. Spending proposals are submitted and voted on by circle members. Once quorum is reached the treasurer (or any member) can execute the transfer. Protocol fees accumulate here and are distributed to governance-approved destinations.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `deposit` | public | Deposit STX into the circle treasury |
| `propose-spend` | public | Create a spending proposal with recipient and amount |
| `vote-spend` | public | Cast a yes/no vote on a spending proposal |
| `execute-spend` | public | Execute an approved spending proposal |
| `collect-fee` | public | Accumulate protocol fees from other contracts |
| `get-balance` | read-only | Returns current treasury STX balance |
| `get-proposal` | read-only | Returns proposal metadata and vote tally |

## Proposal Lifecycle

```
propose-spend → vote-spend (×N members)
    → [quorum reached] → execute-spend → STX transfer
```

## Quorum Rules

- Default quorum: ≥ 51 % of active circle members
- Quorum threshold is configurable via `protocol-config.clar`
- Proposal expires after `PROPOSAL_TTL` blocks without quorum

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Caller is not a circle member |
| `u402` | `ERR_INSUFFICIENT_FUNDS` | Treasury balance too low |
| `u404` | `ERR_TOO_EARLY` | Proposal has not yet reached quorum |
| `u405` | `ERR_TOO_LATE` | Proposal has already been executed or expired |
| `u409` | `ERR_ALREADY_VOTED` | Member has already voted on this proposal |

## Security Notes

- Spending is gated by on-chain quorum — no single-key treasury spend
- Fee collection is callable only by whitelisted protocol contracts
- Executed proposals are permanently archived (replay protection)
- Treasury balance is verified pre-transfer to prevent over-spend race conditions
