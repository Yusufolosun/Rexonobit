# cooperative-registry.clar

## Purpose

Member and cooperative circle registry. Controls who is allowed to interact with the protocol. Every other contract checks membership here before allowing an action.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `register-member` | public | Register `tx-sender` as a protocol member |
| `create-circle` | public | Create a new cooperative circle |
| `join-circle` | public | Join an existing circle by ID |
| `vouch-member` | public | Vouch for another member (increases their endorsement score) |
| `is-member` | read-only | Returns `true` if address is a registered member |
| `get-circle` | read-only | Returns circle data for a given circle ID |
| `get-total-circles` | read-only | Returns total number of circles created |
| `get-total-members` | read-only | Returns total number of registered members |

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Caller is not a registered member |
| `u408` | `ERR_ALREADY_MEMBER` | Address is already registered |

## Security Notes

- Membership is permissionless; anyone with a Stacks address can register
- Circle creation requires the creator to be a registered member first
- Vouching has a cooldown to prevent endorsement spam
