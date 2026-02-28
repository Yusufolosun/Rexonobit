# reputation-nft.clar

## Purpose

Soulbound SIP-009 NFT contract that awards non-transferable reputation badges to members. Badges are minted automatically when a member crosses a milestone threshold (e.g. trust score tier upgrade, N loans repaid, N ROSCA cycles completed). Five badge tiers exist from Bronze through Platinum.

## Key Functions

| Function | Type | Description |
|----------|------|-------------|
| `mint-badge` | public | Mint a badge for a member (callable by whitelisted contracts) |
| `get-badge` | read-only | Returns badge metadata for a given token ID |
| `get-last-token-id` | read-only | Returns the last minted token ID (SIP-009) |
| `get-token-uri` | read-only | Returns off-chain metadata URI for a token |
| `get-owner` | read-only | Returns current owner of a token ID |
| `transfer` | public | Intentionally disabled — always returns `ERR_SOULBOUND` |

## Badge Tiers

| Tier | Threshold | Description |
|------|-----------|-------------|
| Bronze | Score ≥ 300 | First milestone — account in good standing |
| Silver | Score ≥ 500 | Active participant across multiple modules |
| Gold | Score ≥ 700 | Trusted long-term member |
| Platinum | Score ≥ 900 | Top-tier reputation |
| Founder | Special | Awarded to genesis circle founders |

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| `u400` | `ERR_NOT_MEMBER` | Recipient is not a registered member |
| `u401` | `ERR_UNAUTHORIZED` | Caller is not a whitelisted minter |
| `u410` | `ERR_SOULBOUND` | Transfer is permanently disabled |
| `u411` | `ERR_ALREADY_MINTED` | Member already holds this tier badge |

## Security Notes

- `transfer` always fails — badges cannot be sold or transferred
- Minting is restricted to the protocol address and approved contracts
- Badge URI points to an immutable IPFS CID (set at mint time, never updated)
- Duplicate badge prevention via `badge-held` map checked before mint
