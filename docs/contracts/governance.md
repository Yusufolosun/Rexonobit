# governance.clar

## Purpose

Trust-weighted on-chain governance system. Members with sufficient trust scores propose and vote on protocol parameter changes, treasury spends, member expulsions, and policy updates. Proposals that reach quorum and pass the voting threshold can be executed after a time-lock.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `propose` | public | Submit a new governance proposal |
| `vote` | public | Cast a yes/no vote (weighted by trust score) |
| `execute` | public | Execute a passed proposal after time-lock expiry |
| `veto` | public (owner) | Emergency veto before execution |
| `get-governance-proposal` | read-only | Returns proposal data for a given ID |

## Proposal Types

| Type | Effect |
|------|--------|
| `PARAM-CHANGE` | Updates a protocol-config parameter |
| `TREASURY-SPEND` | Authorises a treasury spend |
| `EXPEL-MEMBER` | Removes a member and freezes their vault |
| `POLICY-UPDATE` | Records a governance policy narrative on-chain |

## Proposal Lifecycle

```
propose → [voting period] → vote (×N members)
    → [if pass + time-lock] → execute
    └──► [if veto] → cancelled
```

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Caller is not a registered member |
| `u401` | `ERR_UNAUTHORIZED` | Veto caller is not authorised |
| `u404` | `ERR_TOO_EARLY` | Time-lock has not elapsed for execution |
| `u407` | `ERR_NOT_FOUND` | Proposal ID does not exist |

## Security Notes

- Voting weight equals the voter's trust score — plutocracy is prevented by the 1000-point score cap
- `execute` is permissionless once the time-lock elapses and the proposal passed
- `veto` is an emergency power — intended for governance bootstrapping phase only
