# Rexonobit

**A Bitcoin-Native Micro-Economy Protocol on Stacks**

> A self-sustaining on-chain cooperative where members save in BTC units, earn through contribution, borrow against trust, and govern their own economy.

---

## Overview

Rexonobit is a decentralized cooperative credit protocol built on the Stacks blockchain, Bitcoin-settled and designed for real people — particularly in emerging markets where Susu, Tontines, and Chit Fund savings groups already operate at scale.

This is not a DEX. It is not an NFT marketplace. It is infrastructure: a permissionless, transparent, Bitcoin-secured cooperative economy.

---

## Architecture — 12 Clarity Contracts

| Contract | Role |
|---|---|
| `cooperative-registry` | Member and circle management |
| `savings-vault` | sBTC/STX savings with streak tracking |
| `trust-score` | Soulbound on-chain credit reputation |
| `lending-pool` | Circle-backed micro-lending |
| `labor-market` | On-chain gig board with attestation |
| `treasury` | Circle treasury with governance controls |
| `governance` | Trust-weighted on-chain voting |
| `rosca` | Rotating savings & credit association |
| `reputation-nft` | Soulbound milestone achievement NFTs |
| `arbitration` | Decentralized dispute resolution panel |
| `synthetic-credit` | BTC-denominated synthetic credit lines |
| `protocol-config` | Global parameters & emergency controls |

---

## Contract Dependency Flow

```
[cooperative-registry] — member exists?
         ↓
[savings-vault] + [rosca] → feeds → [trust-score]
         ↓                                  ↓
[lending-pool] ← checks ← [trust-score]    ↓
         ↓                          [synthetic-credit]
[labor-market] → disputes → [arbitration]
         ↓
[treasury] ← governed by ← [governance]
         ↓
[reputation-nft] ← milestones from all contracts
         ↑
[protocol-config] — parameters for everything
```

---

## Tech Stack

- **Smart Contracts**: Clarity 2 on Stacks
- **Frontend**: React + TypeScript + Vite
- **Wallet**: Hiro Wallet via `@stacks/connect`
- **Transactions**: `@stacks/transactions`
- **Network reads**: Stacks API (no backend required)
- **Deployment**: Vercel (free tier) — zero ongoing cost

---

## Local Development

### Prerequisites

- [Clarinet](https://docs.hiro.so/clarinet/getting-started) v2+
- [Node.js](https://nodejs.org/) v18+
- [Hiro Wallet](https://wallet.hiro.so/) browser extension

### Smart Contracts

```bash
# Check contract syntax
clarinet check

# Run tests
clarinet test

# Start local devnet
clarinet integrate
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with your deployer address
npm install
npm run dev
```

---

## Security

- All private keys, mnemonics, and wallet files are gitignored
- `.env` is gitignored; only `.env.example` is committed
- Clarinet `settings/Mainnet.toml` and `settings/Testnet.toml` are gitignored
- Never commit secrets — see `.gitignore`

---

## Deployment Cost Estimate

| Item | Cost |
|---|---|
| 12 Clarity contracts | ~60 STX total |
| Per-user transaction | ~5000 microSTX (~$0.001) |
| Frontend hosting (Vercel) | $0 |
| Backend infrastructure | $0 (pure on-chain) |

---

## Roadmap

- **MVP (V1)**: `cooperative-registry`, `savings-vault`, `trust-score`, `lending-pool`, `rosca`
- **V2**: `labor-market`, `treasury`, `governance`, `arbitration`
- **V3**: `reputation-nft`, `synthetic-credit`, `protocol-config` DAO handoff

---

## License

MIT
