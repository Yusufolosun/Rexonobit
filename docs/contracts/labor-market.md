# labor-market.clar

## Purpose

On-chain gig economy board. Employers post tasks with STX bounties; workers bid and are accepted; deliverables are submitted and attested by the employer. Disputed tasks escalate to the arbitration contract.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `post-task` | public | Post a task with circle ID, description, requirements, and bounty |
| `bid-task` | public | Submit a bid for an open task |
| `accept-bid` | public | Task poster accepts a specific bidder |
| `submit-work` | public | Accepted worker submits a deliverable link/hash |
| `attest-completion` | public | Task poster attests that work was completed satisfactorily |
| `dispute-task` | public | Open a dispute (escalates to arbitration) |
| `get-task` | read-only | Returns task info for a given task ID |
| `get-total-tasks` | read-only | Returns total number of tasks ever posted |

## Task Lifecycle

```
post-task → bid-task (×N workers) → accept-bid → submit-work → attest-completion
                                                          └──► dispute-task → arbitration
```

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Caller is not a registered member |
| `u401` | `ERR_UNAUTHORIZED` | Only task poster can accept bids or attest |
| `u407` | `ERR_NOT_FOUND` | Task or bid not found |
| `u410` | `ERR_CIRCLE_NOT_ACTIVE` | Task does not belong to an active circle |

## Security Notes

- Bounty STX is locked in the contract at `post-task` time
- `attest-completion` is the only trigger that releases bounty to the worker
- Disputed tasks freeze the bounty until arbitration resolution
- `post-task` deducts bounty from the poster's vault balance as escrow
