# ROSCA Mechanics

> Rotating Savings and Credit Association — on-chain implementation

---

## Overview

A ROSCA (also called a *tontine* or *chama*) is a group savings scheme where members contribute equal amounts each cycle and one member receives the full pot per cycle. REXONOBIT implements interest-free ROSCAs on Stacks with Bitcoin-anchored finality.

**Contract:** `rosca.clar`

---

## Lifecycle Diagram

```
[create-circle]
       │
       ▼
  OPEN (recruiting)
       │  register-member() × N  (≤ max-members)
       │
       ▼
  ACTIVE (contributing)  ◄──────────────────────────────┐
       │  contribute() each cycle-length blocks          │
       │  select-recipient() → payout-recipient           │
       │  rotate-recipient()                              │
       │                                                  │
       │  (if all members paid out)                       │
       ├──────────────────────────────────────────────── ─┘
       │
       ▼
  COMPLETED (all cycles done)
       │
       ▼
  [distribute-surplus] (any rounding remainder)
```

---

## Key Data Structures

### Circle

| Field | Type | Description |
|-------|------|-------------|
| `circle-id` | `uint` | Auto-incremented ID |
| `admin` | `principal` | Creator / admin |
| `contribution` | `uint` | Per-cycle contribution (uSTX) |
| `cycle-length` | `uint` | Blocks per cycle |
| `max-members` | `uint` | Maximum participants |
| `current-cycle` | `uint` | Current cycle index (0-based) |
| `payout-order` | `list` | Shuffled recipient order |
| `status` | `uint` | `1`=OPEN `2`=ACTIVE `3`=COMPLETED |

### Member Record

| Field | Type | Description |
|-------|------|-------------|
| `paid-cycles` | `uint` | Number of cycles contributed |
| `received-payout` | `bool` | Whether member has received the pot |
| `missed-contributions` | `uint` | Consecutive missed contributions |

---

## Cycle Mechanics

### Contribution Window

Each cycle spans `cycle-length` blocks. Members must call `contribute()` within the window. The contract checks `block-height` against `cycle-start-block + cycle-length`.

```
cycle N window: [cycle-start-block, cycle-start-block + cycle-length)
```

### Payout Selection

The payout order is determined at circle creation using a pseudo-random seed derived from `block-height` and `tx-sender`. Order is stored in the `payout-order` list and consumed sequentially each cycle.

### Late / Missed Contributions

- 1 missed contribution → warning event emitted
- 3 consecutive misses → member flagged as delinquent
- Delinquent member: trust score penalty via `trust-score.clar`
- Circle admin may call `remove-delinquent-member` (OPEN status only)

---

## Guard Conditions

| Action | Guard |
|--------|-------|
| `register-member` | Status = OPEN, seats available, member not already registered |
| `contribute` | Status = ACTIVE, within cycle window, member not yet paid this cycle |
| `select-recipient` | Status = ACTIVE, cycle end block reached, all contributions collected |
| `create-circle` | `contribution > 0`, `max-members ≥ 2`, `cycle-length ≥ 144` (≥1 day) |
| `lock-and-start` | Status = PENDING; does **not** transfer STX — purely activates the ROSCA |

> **Note:** `lock-and-start` is a status-transition-only call (PENDING → ACTIVE).
> All STX collection happens via `contribute` on a per-cycle basis, so members
> are never charged upfront.

---

## Payout Formula

```
payout = contribution × member-count
```

No protocol fee is levied on ROSCA payouts. Treasury receives a small flat fee (`rosca-creation-fee`) at circle creation.

---

## Trust Score Impact

| Event | Score Delta |
|-------|-------------|
| On-time contribution | `+5` |
| Missed contribution | `−10` |
| Circle completion (as member) | `+15` |
| Delinquency removal by admin | `−25` |

Trust score changes are written by calling `update-score` on `trust-score.clar`. Only the ROSCA contract is an authorized writer for these events.

---

## Error Codes (1100–1199)

| Code | Constant | Meaning |
|------|----------|---------|
| 1100 | `err-not-found` | Circle does not exist |
| 1101 | `err-not-member` | Caller is not a member |
| 1102 | `err-already-member` | Caller already registered |
| 1103 | `err-circle-full` | Max members reached |
| 1104 | `err-invalid-status` | Action not allowed in current status |
| 1105 | `err-already-paid` | Member already contributed this cycle |
| 1106 | `err-cycle-not-ended` | Cycle end block not yet reached |
| 1107 | `err-not-admin` | Caller is not the circle admin |

---

## Integration Points

- **`lending-pool.clar`** — circle membership increases loan eligibility
- **`trust-score.clar`** — authorized to update scores
- **`treasury.clar`** — receives creation fee, holds surplus
- **`reputation-nft.clar`** — mints NFT badge after circle completion
