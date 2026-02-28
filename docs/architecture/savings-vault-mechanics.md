# Savings Vault — Mechanics

**Contract:** `contracts/savings-vault.clar`

The Savings Vault enables cooperative members to deposit STX into a time-locked pool, earn a streak-based loyalty bonus, and access emergency withdrawal at a penalty.

---

## Overview

```
Member
  │ deposit(amount)
  ▼
Savings Vault
  │ records deposit, lock-height, streak
  │ yields trust-score boost on each contribution
  ▼
  │ After lock-period expires
  │ withdraw(amount) → principal + optional yield
  ▼
Member
```

---

## Deposit Flow

1. Caller must be a registered member of an active cooperative.
2. `amount` must be `>= min-deposit` (from `protocol-config`).
3. STX transferred from caller → vault.
4. Record:
   - `deposited-at` = `block-height`
   - `lock-until` = `block-height + lock-period`
   - `streak` incremented if last deposit was within `streak-window` blocks.
5. Trust score updated via `trust-score.record-savings-contribution`.

---

## Lock Periods

| Period Key | Default Blocks | Approx. Duration |
|------------|---------------|-----------------|
| `short` | 144 | ~1 day |
| `medium` | 1008 | ~1 week |
| `long` | 4320 | ~1 month |

Lock period is chosen by the depositor at deposit time and stored on-chain.

### Lock-Extension-Only Rule

Subsequent calls to `lock-savings` must specify a lock period whose resulting
`unlock-at` (`block-height + lock-blocks`) is **at or beyond** the existing
`lock-until` value.  Attempts to shorten an active lock are rejected with
`ERR-LOCK-SHORTENING (u210)`.  This prevents a depositor from circumventing a
long-term commitment by overwriting it with a shorter lock.

---

## Withdrawal Rules

| Condition | Outcome |
|-----------|---------|
| `block-height >= lock-until` | Full withdrawal, yield credited |
| `block-height < lock-until` | Early withdrawal penalty applies |
| Member inactive/deregistered | Emergency withdrawal permitted (no yield) |

**Early withdrawal penalty** = `deposit-amount × early-penalty-bps / 10000`  
Penalty is collected by the cooperative treasury.

---

## Streak Bonus

Each consecutive on-time contribution (within `streak-window` blocks) increments the member's streak counter. The trust-score module applies a multiplier based on streak depth:

| Streak | Trust Modifier |
|--------|---------------|
| 0 | 0× |
| 1–4 | +5 pts each |
| 5–9 | +8 pts each |
| 10+ | +12 pts each |

Streak is reset to 0 if the member misses the window.

---

## Yield Calculation

Yield is a fixed APY backed by cooperative fee income. The formula is:

$$
\text{yield} = \text{principal} \times \frac{\text{APY}}{10000} \times \frac{\text{actual\_blocks}}{\text{blocks\_per\_year}}
$$

Where `blocks_per_year ≈ 52560` (144 blocks/day × 365).

---

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| 1200 | `ERR_NOT_MEMBER` | Caller not a registered member |
| 1201 | `ERR_BELOW_MINIMUM` | Deposit below minimum threshold |
| 1202 | `ERR_STILL_LOCKED` | Withdrawal attempted before lock expiry |
| 1203 | `ERR_ZERO_DEPOSIT` | Deposit amount is zero |
| 1204 | `ERR_NO_DEPOSIT` | No active deposit found |
| 1205 | `ERR_TRANSFER_FAILED` | STX transfer failed |
| 210 | `ERR_LOCK_SHORTENING` | New lock would shorten an existing lock period |

---

## Read-Only Functions

| Function | Returns |
|----------|---------|
| `get-deposit-balance(principal)` | `(ok uint)` current deposit amount |
| `get-lock-height(principal)` | `(ok uint)` unlock block height |
| `get-streak(principal)` | `(ok uint)` current contribution streak |
| `get-yield-estimate(principal)` | `(ok uint)` projected yield at current block |
