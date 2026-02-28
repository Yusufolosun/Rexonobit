# Treasury Mechanics

> Protocol treasury — custody, disbursement, and reserve management

---

## Overview

`treasury.clar` is the central fund custodian for the REXONOBIT protocol. It holds:
- Loan origination fees
- ROSCA creation fees
- Synthetic credit draw fees
- Governance-directed reserves
- Dispute fines

No direct user deposits are accepted; all inflows are triggered by other protocol contracts.

---

## Inflow Sources

| Source Contract | Event | Amount |
|----------------|-------|--------|
| `lending-pool.clar` | Loan fee deduction | `principal × loan-fee-bps / 10000` |
| `rosca.clar` | Circle creation fee | `rosca-creation-fee` (flat) |
| `synthetic-credit.clar` | Draw fee | `amount × credit-draw-fee-bps / 10000` |
| `arbitration.clar` | Void ruling fine | Disputed amount |
| `savings-vault.clar` | Early-exit penalty | `penalty-bps` of amount |

---

## Outflow Types

| Type | Trigger | Recipient |
|------|---------|-----------|
| Governance disbursement | `execute-proposal` | Any principal |
| Arbitration payout (claimant wins) | `resolve-dispute` | Claimant |
| Arbitration refund (respondent wins) | `resolve-dispute` | Respondent |
| Split ruling | `resolve-dispute` | Both parties (configurable ratio) |
| Emergency maintenance | Emergency multisig | Designated address |

---

## Custody Model

Treasury funds are custodied as native **uSTX** in the `treasury.clar` contract address. The contract tracks a `reserve-target` (set by governance) and a `disbursement-limit` per proposal.

```clarity
;; Max single disbursement without 5-of-5 emergency override
disbursement-limit: 10_000_000_000 ;; 10,000 STX
```

---

## Reserve Ratio

The protocol maintains a `min-reserve-ratio` (default: `20%`):

```
available-for-disbursement = total-balance − max(0, reserve-target − current-reserves)
```

Governance proposals may not disburse below the reserve floor.

---

## Error Codes (800–899)

| Code | Constant | Meaning |
|------|----------|---------|
| 800 | `err-unauthorized` | Caller is not an authorized contract or admin |
| 801 | `err-insufficient-balance` | Requested amount exceeds treasury balance |
| 802 | `err-below-reserve` | Disbursement would breach reserve floor |
| 803 | `err-over-limit` | Amount exceeds single-disbursement limit |
| 613 | `ERR-QUORUM-NOT-MET` | Fewer than the required share of circle members voted |

---

## Quorum Requirement

`execute-spend` now enforces a minimum participation threshold before
evaluating the yes/no ratio.  The `treasury-quorum-bps` parameter
(default **5000** = 50 %) defines the minimum share of circle members
that must have voted.  If participation falls below the quorum, execution
is rejected with `ERR-QUORUM-NOT-MET (u613)` regardless of the approval
ratio.

This prevents a scenario in which a single "yes" vote achieves 100 %
approval in a 10-member circle, passing the supermajority check.

---

## Integration Points

- **`governance.clar`** — sole authorized caller for governance disbursements
- **`lending-pool.clar`** — transfers loan fees on origination
- **`rosca.clar`** — transfers circle creation fees
- **`synthetic-credit.clar`** — transfers draw fees
- **`arbitration.clar`** — initiates payouts after rulings
