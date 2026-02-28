# Labor Market Mechanics

> On-chain task marketplace for cooperative member services

---

## Overview

`labor-market.clar` implements a permissioned task marketplace where cooperative members can post tasks, receive bids, and pay for completed work — all settled in STX via escrow.

---

## Task Lifecycle

```
[post-task]
      │  Poster stakes (amount + platform-fee) into escrow
      │
      ▼
  OPEN ◄── bid-period (default 288 blocks)
      │  submit-bid() by registered workers
      │
      ▼
  BIDS_IN  (max-bids reached OR bid period ends)
      │
      ▼
  [accept-bid]  by poster → specific worker selected
      │
      ▼
  IN_PROGRESS
      │  submit-delivery() by worker
      │
      ├── submit-delivery() accepted by poster → COMPLETED → escrow released
      └── submit-delivery() rejected → arbitration OR auto-complete (after grace)
```

---

## Bid Mechanics

| Rule | Detail |
|------|--------|
| `max-bids-per-task` | `10` (configurable) |
| Bid validity | Must be ≤ `task-amount + 20%` (no over-bidding) |
| Bid expiry | Bid is valid until bid-period end or poster acceptance |
| Anti-spam | Workers need trust score ≥ `min-worker-score` (default 50) to bid |

---

## Escrow Flow

```
post-task():
  poster → escrow (amount + platform_fee)

accept-bid():
  — worker is selected; escrow remains locked

submit-delivery() + poster confirms:
  escrow (amount) → worker
  escrow (platform_fee) → treasury
  lost bids: no action (no stake required to bid)

dispute-delivery() → arbitration:
  escrow stays locked until ruling
  arbitration ruling releases escrow to winner
```

---

## Platform Fee

```
platform_fee = task_amount × platform-fee-bps / 10000
```

Default `platform-fee-bps`: `250` (2.5%)

---

## Trust Score Impact

| Event | Poster | Worker |
|-------|--------|--------|
| Task posted | `0` | — |
| Delivery confirmed | `+5` | `+10` |
| Dispute filed | `−5` | `−5` |
| Dispute: worker wins | `−20` | `+15` |
| Dispute: poster wins | `+10` | `−25` |
| No-show by worker | `0` | `−15` |

---

## Auto-Complete Guard

If the poster does not confirm or reject within `auto-confirm-blocks` (default: `144` blocks ≈ 1 day) after `submit-delivery`, any party may call `auto-complete` to release funds to the worker.

---

## Error Codes (900–999)

| Code | Constant | Meaning |
|------|----------|---------|
| 900 | `err-not-found` | Task does not exist |
| 901 | `err-not-poster` | Caller is not the task poster |
| 902 | `err-not-worker` | Caller is not the assigned worker |
| 903 | `err-invalid-status` | Action not allowed in current task status |
| 904 | `err-bid-period-closed` | Bid period has ended |
| 905 | `err-max-bids-reached` | Task has reached maximum bid count |
| 906 | `err-insufficient-score` | Worker trust score below minimum |
| 907 | `err-not-member` | Caller is not a registered member |
| 908 | `err-over-bid-limit` | Bid amount exceeds 120% of task amount |

---

## Integration Points

- **`cooperative-registry.clar`** — membership check for poster and worker
- **`trust-score.clar`** — read (worker eligibility) + write (outcomes)
- **`treasury.clar`** — receives platform fees
- **`arbitration.clar`** — handles disputed deliveries
