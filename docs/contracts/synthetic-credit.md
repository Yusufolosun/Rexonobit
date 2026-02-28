# synthetic-credit.clar

## Purpose

sCREDIT is the protocol's native fungible token (SIP-010). It functions as synthetic credit collateralised by a member's locked savings and trust multiplier. Members mint sCREDIT against their vault collateral and burn it to unlock. sCREDIT can be used for fee payment, governance weight, and within-protocol transfers — but cannot be bridged externally until a governance vote enables it.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `mint` | public | Mint sCREDIT up to collateral ceiling |
| `burn` | public | Burn sCREDIT to reduce outstanding position |
| `transfer` | public | Transfer sCREDIT to another member |
| `get-balance` | read-only | Returns sCREDIT balance for a principal |
| `get-total-supply` | read-only | Returns total circulating sCREDIT |
| `get-collateral-ceiling` | read-only | Returns maximum mintable sCREDIT for a principal |
| `get-token-uri` | read-only | Returns SIP-010 off-chain metadata URI |

## Collateral Formula

$$
\text{ceiling} = \text{lockedSTX} \times \frac{\text{trustScore}}{1000} \times C_f
$$

Where $C_f$ is the collateral factor set in `protocol-config.clar` (default 0.7).

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Caller is not a registered member |
| `u412` | `ERR_OVER_CEILING` | Mint amount exceeds collateral ceiling |
| `u413` | `ERR_INSUFFICIENT_SCREDIT` | Burn or transfer amount exceeds balance |
| `u414` | `ERR_ZERO_COLLATERAL` | No locked STX available as collateral |

## Security Notes

- Collateral ceiling is recalculated at mint time — not at deposit time — preventing stale reads
- Burning reduces outstanding supply atomically with balance decrement
- Transfers are restricted to registered members to prevent accidental sends to external wallets
- Governance can pause minting by setting `SCREDIT_MINT_ENABLED` to `false` in `protocol-config.clar`
