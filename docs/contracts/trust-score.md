# trust-score.clar

## Purpose

Soulbound on-chain credit reputation system. Each member's trust score is decomposed into five sub-scores: savings points, loan repayment points, endorsement points, labor market points, and penalty deductions. The aggregate score determines loan eligibility, credit limits, and governance voting weight.

## Score Structure

```
Total Score = savings_points + loan_points + endorsement_points + labor_points - penalty_points
```

Points range: 0–1000

## Tier Thresholds

| Tier | Min Score | Benefits |
|------|-----------|---------|
| Platinum | 900 | Max credit limit, max loan, badge NFT |
| Gold | 700 | High credit limit, priority ROSCA payout |
| Silver | 500 | Standard credit access |
| Bronze | 300 | Basic loan eligibility |
| Newcomer | 0 | Registration only |

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `add-savings-points` | public (vault) | Award points for deposit/lock activity |
| `add-loan-points` | public (pool) | Award points for on-time loan repayment |
| `add-endorsement-points` | public (registry) | Award points for member vouches |
| `add-labor-points` | public (market) | Award points for completed tasks |
| `apply-penalty` | public (arbitration) | Deduct points for lost disputes |
| `get-trust-score` | read-only | Returns aggregate score for an address |
| `get-trust-score-full` | read-only | Returns all sub-scores and total |
| `get-trust-tier` | read-only | Returns tier string (Platinum/Gold/etc.) |

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Caller is not a registered member |
| `u401` | `ERR_UNAUTHORIZED` | Only designated contracts can call point functions |

## Security Notes

- Only whitelisted contracts (savings-vault, lending-pool, etc.) can award points
- Penalty applications require arbitration contract authority
- Score is read-only to external callers — no direct manipulation by users
