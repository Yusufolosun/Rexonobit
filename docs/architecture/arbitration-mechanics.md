# Arbitration Mechanics

> On-chain dispute resolution for REXONOBIT labor-market tasks and ROSCA circles

---

## Overview

The `arbitration.clar` contract provides a three-phase dispute resolution system: **file → respond → resolve**. An independent arbitrator panel (multi-sig) reviews evidence and issues a binding ruling that triggers payouts or refunds via the treasury.

**Contract:** `arbitration.clar`

---

## Dispute Lifecycle

```
[file-dispute]
      │
      ▼
  OPEN ◄── evidence-period (default 288 blocks ≈ 2 days)
      │  submit-evidence() by either party
      │  counter-evidence() by opposing party
      │
      ▼
  UNDER_REVIEW ◄── review-period (default 144 blocks ≈ 1 day)
      │  arbitrators review on-chain evidence hashes
      │
      ▼
  [resolve-dispute]
      │  ruling: "claimant-wins" | "respondent-wins" | "split"
      │
      ├── claimant-wins ──► treasury transfers disputed amount to claimant
      ├── respondent-wins ──► treasury releases funds to respondent
      └── split ──► 50/50 split (or custom bps) from treasury
```

---

## Parties

| Role | Description |
|------|-------------|
| Claimant | The party filing the dispute |
| Respondent | The party being disputed against |
| Arbitrators | `3-of-5` multi-sig panel (configurable in `protocol-config`) |

---

## Evidence

Evidence is stored as a **SHA-256 hash on-chain** — actual documents are stored off-chain (IPFS or encrypted storage). The contract stores:

```clarity
{
  evidence-hash: (buff 32),
  submitter: principal,
  block-submitted: uint,
  evidence-type: uint  ;; 1=document 2=screenshot 3=tx-proof 4=witness
}
```

Parties may submit up to `max-evidence-items` (default: `5`) items during the evidence window.

---

## Rulings

| Ruling Code | Outcome |
|-------------|---------|
| `1` | Claimant wins — full amount to claimant |
| `2` | Respondent wins — full amount returned to respondent |
| `3` | Split — configurable split ratio (default 50/50) |
| `4` | Void — both parties penalized; funds sent to treasury reserve |

---

## Trust Score Impact

| Event | Claimant Change | Respondent Change |
|-------|----------------|-------------------|
| Claimant wins | `+15` | `−30` |
| Respondent wins | `−20` | `+10` |
| Split ruling | `−5` | `−5` |
| Void ruling | `−25` | `−25` |

Scoring changes are applied by calling `trust-score.clar`'s `update-score`. Only `arbitration.clar` is authorized for dispute-resolution score events.

---

## Guard Conditions

| Action | Guard |
|--------|-------|
| `file-dispute` | Both parties must be registered members, disputed task must exist, filing fee paid |
| `submit-evidence` | Status = OPEN, within evidence window, submitter is a party |
| `resolve-dispute` | Status = UNDER_REVIEW, caller is arbitrator, review window elapsed |

---

## Fees and Stakes

- **Filing fee**: `dispute-filing-fee` (default: `500_000 uSTX`). Refunded to winner.
- **Stake**: Disputed amount is held in escrow by `treasury.clar` during resolution.

---

## Error Codes (1000–1099)

| Code | Constant | Meaning |
|------|----------|---------|
| 1000 | `err-not-found` | Dispute or task not found |
| 1001 | `err-not-party` | Caller is not a party to this dispute |
| 1002 | `err-invalid-status` | Action not allowed in current status |
| 1003 | `err-evidence-window-closed` | Evidence submission period ended |
| 1004 | `err-too-many-evidence` | Max evidence items reached |
| 1005 | `err-not-arbitrator` | Caller is not an arbitrator |
| 1006 | `err-review-not-started` | Review period not yet begun |

---

## Integration Points

- **`labor-market.clar`** — triggers dispute on task-delivery rejection
- **`rosca.clar`** — circle admin can raise dispute on delinquent member payout
- **`trust-score.clar`** — authorized to update dispute-outcome scores
- **`treasury.clar`** — holds escrow and executes ruling payouts
