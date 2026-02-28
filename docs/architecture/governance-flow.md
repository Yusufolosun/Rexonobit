# Governance Flow

> Protocol governance — proposal creation, voting, execution lifecycle

---

## Overview

REXONOBIT uses an on-chain governance contract (`governance.clar`) that follows a **propose → vote → veto window → execute** model. Parameter changes and treasury disbursements require governance approval.

---

## Lifecycle Diagram

```
[create-proposal]
       │
       ▼
  ACTIVE  ◄── voting-period (blocks)
       │  vote-yes() / vote-no()
       │
       ▼
  PASSED (if yes-votes > quorum threshold) ──► FAILED (otherwise)
       │
       ▼
  VETO WINDOW  ◄── veto-period (blocks)
       │  veto() by emergency-multisig
       │
       ├── vetoed ──► VETOED
       │
       ▼
  EXECUTABLE
       │  execute-proposal()
       │
       ▼
  EXECUTED
```

---

## Proposal Types

| Type | Target | Effect |
|------|--------|--------|
| `parameter-change` | `protocol-config.clar` | Update any protocol parameter |
| `treasury-disbursement` | `treasury.clar` | Transfer STX from treasury to a recipient |
| `contract-upgrade` | Protocol contract | Replace a whitelisted contract address |
| `emergency-pause` | Any contract | Toggle `paused` flag |

---

## Voting Power

Voting power is derived from **trust score** at the time of voting:

```
votes = trust-score(voter) / VOTING_SCORE_DIVISOR
```

`VOTING_SCORE_DIVISOR` is a protocol parameter (default: `10`). Voters with score `< MIN_VOTING_SCORE` (default: `100`) have no voting power.

---

## Quorum and Threshold

| Parameter | Default | Config Key |
|-----------|---------|-----------|
| `quorum-votes` | `1000` | `governance-quorum` |
| `pass-threshold-pct` | `60%` | `governance-threshold` |
| `voting-period` | `1440` blocks (~10 days) | `voting-period` |
| `veto-period` | `288` blocks (~2 days) | `veto-period` |

A proposal **passes** when:

```
yes-votes ≥ quorum-votes  AND  yes-votes / (yes-votes + no-votes) ≥ pass-threshold-pct
```

---

## Execution

After the veto window expires without a veto, any address may call `execute-proposal`. The execution payload is a `(contract-call? ...)` that was stored at proposal creation.

**Security constraints:**
- Only whitelisted target contracts are callable.
- Execution must happen within `execution-window` blocks after veto expiry (default: `1440`). Expired proposals must be re-proposed.

---

## Guard Conditions

| Action | Guard |
|--------|-------|
| `create-proposal` | Proposer score ≥ `min-proposal-score` (default 200), not paused |
| `vote-yes` / `vote-no` | Status = ACTIVE, voter not already voted, within voting period |
| `veto` | Status = PASSED, within veto period, caller is emergency-multisig |
| `execute-proposal` | Status = EXECUTABLE, within execution window |

---

## Error Codes (600–699)

| Code | Constant | Meaning |
|------|----------|---------|
| 600 | `err-not-found` | Proposal does not exist |
| 601 | `err-already-voted` | Caller already cast a vote |
| 602 | `err-voting-closed` | Voting period has ended |
| 603 | `err-invalid-status` | Action not allowed in current status |
| 604 | `err-quorum-not-met` | Not enough votes to pass |
| 605 | `err-not-authorized` | Caller cannot execute this action |
| 606 | `err-execution-expired` | Execution window elapsed |

---

## Integration Points

- **`protocol-config.clar`** — governance is the only authorized writer for config parameters
- **`trust-score.clar`** — read to determine voting power; score update on successful proposal execution (+20)
- **`treasury.clar`** — treasury disbursements are initiated by governance execution
- **`reputation-nft.clar`** — badges awarded after a member's first successful governance contribution

---

## Emergency Multisig

A `3-of-5` principal list is defined in `protocol-config` under `emergency-signers`. During the veto window, any single emergency signer can call `veto`. After a veto the proposal enters `VETOED` status and cannot be re-executed; a new proposal must be created.
