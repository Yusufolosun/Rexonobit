# rosca.clar

## Purpose

On-chain implementation of a Rotating Savings and Credit Association (ROSCA) — also known as a Susu, Tontine, or Chit Fund. Members contribute equal amounts each cycle; one member receives the full pot per cycle. Order is set collaboratively or randomly.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `create-rosca` | public | Create a new ROSCA circle with contribution amount and cycle length |
| `join-rosca` | public | Join an open ROSCA circle by ID |
| `start-cycle` | public | Lock the ROSCA and start the first contribution cycle |
| `contribute` | public | Contribute the fixed amount for the current cycle |
| `set-payout-order` | public | Agree on the payout order (must be unanimous) |
| `trigger-payout` | public | Send the pot to the designated member for this cycle |
| `get-rosca-info` | read-only | Returns ROSCA metadata and current cycle state |

## Cycle Flow

```
create-rosca → join-rosca (×N members) → start-cycle
    → [per cycle] contribute (×N) → trigger-payout
    → [repeat N times] until all members have received the pot
```

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Caller is not a registered member |
| `u405` | `ERR_TOO_LATE` | ROSCA is already full or cycle has started |
| `u404` | `ERR_TOO_EARLY` | Contribution for this cycle not yet due |
| `u406` | `ERR_INVALID_AMOUNT` | Contribution amount doesn't match required amount |
| `u410` | `ERR_CIRCLE_NOT_ACTIVE` | ROSCA has not started yet or is already complete |

## Security Notes

- `trigger-payout` verifies all members have contributed before releasing funds
- Payout order requires unanimous member consent before locking in
- No admin can redirect funds; only the designated payout recipient receives the pot
