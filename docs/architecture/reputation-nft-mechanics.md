# Reputation NFT — Mechanics

**Contract:** `contracts/reputation-nft.clar`

The Reputation NFT is a soulbound, non-transferable SIP-009 NFT that represents a member's on-chain reputation within the Rexonobit protocol. Each cooperative member is eligible for exactly one token.

---

## Overview

```
Member joins cooperative
        │
        ▼
reputation-nft.mint(member)
        │ — checks: not already minted, is-member
        ▼
Token ID assigned (auto-increment)
Metadata URI stored on-chain
Trust score bootstrap event emitted
```

---

## Soulbound Constraint

The NFT deliberately violates the SIP-009 `transfer` standard to prevent secondary market trading:

```clarity
(define-public (transfer (id uint) (sender principal) (recipient principal))
  (err ERR_SOULBOUND))
```

Any attempt to transfer returns `(err u401)`.

---

## Token Metadata

Each token stores a reference URI following the format:

```
https://metadata.rexonobit.io/{network}/reputation/{token-id}
```

The metadata JSON (served off-chain) includes:

| Field | Description |
|-------|-------------|
| `name` | "Rexonobit Reputation" |
| `description` | Member address and cooperative name |
| `image` | SVG generated from trust score tier |
| `attributes` | trust_tier, cooperative_id, minted_at_block |

---

## Trust Tiers

Trust tier is computed from the current trust score at time of metadata refresh:

| Score | Tier | Badge |
|-------|------|-------|
| 0–199 | Newcomer | ⬜ |
| 200–399 | Builder | 🟦 |
| 400–599 | Contributor | 🟩 |
| 600–799 | Trusted | 🟨 |
| 800–999 | Pillar | 🟧 |
| 1000+ | Legend | 🟥 |

---

## Mint Rules

1. Caller must be the **cooperative deployer** or **trust-score contract** (via contract-call).
2. The `principal` must be a registered member with `is-active = true`.
3. A principal can hold at most **one** reputation token.
4. Token IDs are sequential, starting at `u1`.

---

## Counter

`get-last-token-id` returns the total number of tokens minted (also the ID of the most recently minted token).

---

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| 400 | `ERR_NOT_FOUND` | Token ID does not exist |
| 401 | `ERR_SOULBOUND` | Transfer is not allowed |
| 402 | `ERR_ALREADY_MINTED` | Principal already has a token |
| 403 | `ERR_NOT_MEMBER` | Principal is not a cooperative member |
| 404 | `ERR_UNAUTHORIZED` | Caller is not authorised to mint |

---

## Read-Only Functions

| Function | Returns |
|----------|---------|
| `get-owner(token-id)` | `(ok (some principal))` |
| `get-token-uri(token-id)` | `(ok (some (string-utf8 200)))` |
| `get-last-token-id()` | `(ok uint)` |
| `has-token(principal)` | `bool` |
