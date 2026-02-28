# Trust Score Algorithm

## Overview

The REXONOBIT trust score is a **non-transferable, soulbound on-chain reputation** stored in the `trust-score` contract. It is the single source of truth for member creditworthiness and gates access to lending, synthetic credit, ROSCA leadership, and governance weight.

The score ranges from **0 to 1,000** (configurable via `protocol-config`). Newly registered members receive a configurable seed score (default `100`).

---

## Score Components

The total score is the **live sum** of four positive components minus accumulated penalty points, capped at the maximum score.

$$
\text{score} = \min\bigl(\text{savings} + \text{loan} + \text{endorsement} + \text{labor} - \text{penalties},\ \text{max\_score}\bigr)
$$

| Component          | Contract Function            | Caller Contract    | Cooldown (default)   |
| ------------------ | ---------------------------- | ------------------ | -------------------- |
| Savings deposit    | `reward-savings`             | `savings-vault`    | 144 blocks (~1 day)  |
| Loan repayment     | `reward-loan-repay`          | `lending-pool`     | 144 blocks (~1 day)  |
| Circle endorsement | `reward-endorsement`         | `cooperative-registry` | 1008 blocks (~1 wk) |
| Labor completion   | `reward-labor`               | `labor-market`     | 144 blocks (~1 day)  |
| Penalty            | `apply-penalty`              | any authorized writer | 144 blocks       |

---

## Authorized Writers

Only contracts registered in the `authorized-writers` map can mutate trust scores. The deployer adds writers during protocol initialization via `set-authorized-writer`. The current authorized set is:

- `savings-vault`
- `lending-pool`
- `cooperative-registry`
- `labor-market`
- `arbitration`

---

## Tiers

Trust tiers gate protocol features and are computed client-side from the raw score:

| Score Range | Tier     | Color    |
| ----------- | -------- | -------- |
| 900–1000    | Platinum | #a8edea  |
| 700–899     | Gold     | #f7931a  |
| 500–699     | Silver   | #9ca3af  |
| 300–499     | Bronze   | #b45309  |
| 0–299       | Starter  | #6b7280  |

---

## Cooldown Guards

Each reward type is protected by a cooldown window measured in block heights:

- `savings-points` cooldown: `savings-reward-cooldown-blocks` config param (default **144 blocks** ≈ 24 hours at 10 min/block)
- `endorsement-points` cooldown: `endorsement-cooldown-blocks` (default **1008 blocks** ≈ 1 week)
- `penalty` cooldown: same as savings cooldown

Cooldowns prevent reward farming. The contract rejects calls with `ERR-COOLDOWN-ACTIVE (u303)` when the cooldown has not elapsed since `last-savings-reward` / `last-endorsement-reward` / `last-penalty`.

---

## Audit Trail

Every score change is recorded in the `score-events` map with:
- `member` principal
- `delta` (positive = reward, negative = penalty)
- `reason` (ASCII string, max 32 chars)
- `caller` contract principal
- `at-block` height

Events are indexed by a monotonically incrementing `score-event-nonce`.

---

## Score Initialization Flow

```
register-member (cooperative-registry)
    └─► initialize-score (trust-score)
            └─ seeds score at protocol-config "trust-seed-score" (default 100)
```

A member's trust profile must be initialized before any authorized writer can award points.

---

## Frontend Integration

The `useTrustScore` hook reads all five sub-components via the `get-trust-score` read-only function and exposes:

```ts
{
  total: number;           // composite score
  savings: number;
  loan: number;
  endorsement: number;
  labor: number;
  penalty: number;
  loading: boolean;
}
```

Tier labels and colors are computed by client-side helpers in `lib/format.ts`.
