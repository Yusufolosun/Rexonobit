# arbitration.clar

## Purpose

Decentralised dispute resolution contract. Any member can open a dispute against another member. Three to five neutral arbitrators join the panel, review evidence (off-chain via CIDs), and submit a verdict. The losing party receives a trust score penalty.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `open-dispute` | public | Open a dispute against another member |
| `join-panel` | public | Volunteer as an arbitrator for an open dispute |
| `submit-verdict` | public | Arbitrator submits their verdict (yes/no for claimant) |
| `close-dispute` | public | Close a dispute once quorum verdict is reached |
| `get-dispute` | read-only | Returns dispute metadata and panel status |

## Dispute Lifecycle

```
open-dispute → join-panel (×3-5 arbitrators)
    → submit-verdict (×N) → [quorum reached] → close-dispute
```

## Verdict Resolution

- If majority votes for claimant → respondent receives trust score penalty
- If majority votes for respondent → claimant receives a smaller penalty (frivolous dispute deterrence)
- Tied panels → no penalty applied; dispute archived

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Caller is not a registered member |
| `u401` | `ERR_UNAUTHORIZED` | Dispute initiator cannot join their own panel |
| `u407` | `ERR_NOT_FOUND` | Dispute ID does not exist |
| `u405` | `ERR_TOO_LATE` | Dispute is already closed |
| `u404` | `ERR_TOO_EARLY` | Panel has not yet reached quorum |

## Security Notes

- Initiators and respondents are excluded from their own panel to prevent bias
- Arbitrators must be registered members (encourages skin-in-the-game)
- Verdict submission is one-per-arbitrator, non-modifiable after submission
- Trust score penalties are applied via `trust-score.clar` — arbitration contract has `apply-penalty` authority
