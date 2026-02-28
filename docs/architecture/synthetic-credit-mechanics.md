# Synthetic Credit Mechanics

> Trust-collateralized credit lines for cooperative members

---

## Overview

Synthetic credit (`synthetic-credit.clar`) issues **trust-backed credit lines** — members with sufficient trust scores can open a revolving credit facility without posting on-chain collateral. The credit limit is derived from the member's trust score and protocol parameters.

---

## Credit Line Lifecycle

```
[open-credit-line]
      │  Eligibility: member registered, trust score ≥ min-credit-score
      │
      ▼
  OPEN (revolving)
      │
      ├── draw-credit()    ← decrease available credit
      ├── repay-credit()   ← increase available credit
      │
      │  (if score drops below threshold or missed payment)
      ▼
  SUSPENDED
      │  repay-credit() still allowed
      │
      ▼
  CLOSED  ← member request or governance action
```

---

## Credit Limit Formula

```
credit_limit = trust_score × credit-per-score-unit
```

`credit-per-score-unit` is a protocol parameter (default: `2000` uSTX per trust point).

| Trust Score | Credit Limit |
|-------------|-------------|
| 100 | 200,000 uSTX (0.2 STX) |
| 500 | 1,000,000 uSTX (1 STX) |
| 1000 | 2,000,000 uSTX (2 STX) |

---

## Draws and Repayments

### Draw
- Permitted when: line is OPEN, `amount ≤ available-credit`
- Available credit = `credit_limit − outstanding_balance`

### Repayment
- Accepted even when line is SUSPENDED (partial repayments allowed)
- Full repayment reactivates SUSPENDED lines if score is still sufficient

---

## Interest and Fees

| Type | Value | Config Key |
|------|-------|-----------|
| Draw fee | `50 bps` (0.5%) | `credit-draw-fee-bps` |
| Late payment penalty | `−15` trust score per missed cycle | `credit-late-penalty` |
| Grace period | `144 blocks` (≈1 day) | `credit-grace-blocks` |

Interest is **not charged** — synthetic credit is part of the cooperative mutual-aid model. The draw fee accrues to `treasury.clar`.

---

## Trust Score Impact

| Event | Score Delta |
|-------|-------------|
| Draw (on-time) | `0` (neutral) |
| Full repayment | `+10` |
| Late repayment (past grace) | `−15` |
| Default (balance after suspension > 90 days) | `−50`, line closed |

---

## Guard Conditions

| Action | Guard |
|--------|-------|
| `open-credit-line` | Member registered, trust score ≥ `min-credit-score` (default 200), no existing open line |
| `draw-credit` | Line status = OPEN, `amount > 0`, amount ≤ `available-credit` |
| `repay-credit` | Line exists, `amount ≤ outstanding_balance` |
| `close-credit-line` | Line status = OPEN or SUSPENDED, outstanding balance = 0 |

---

## Error Codes (700–799)

| Code | Constant | Meaning |
|------|----------|---------|
| 700 | `err-not-found` | Credit line does not exist |
| 701 | `err-already-exists` | Member already has an open line |
| 702 | `err-insufficient-score` | Trust score below minimum threshold |
| 703 | `err-line-suspended` | Line suspended; only repayments allowed |
| 704 | `err-over-limit` | Draw would exceed available credit |
| 705 | `err-not-member` | Caller is not a registered member |
| 706 | `err-balance-nonzero` | Cannot close line with outstanding balance |

---

## Integration Points

- **`cooperative-registry.clar`** — membership check at open-credit-line
- **`trust-score.clar`** — read for limit calculation; write for repayment bonuses
- **`treasury.clar`** — receives draw fees; holds protocol reserves
- **`lending-pool.clar`** — synthetic credit and pool loans share a member exposure cap
