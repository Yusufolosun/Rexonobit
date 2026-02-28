# REXONOBIT

**Bitcoin-Native Micro-Economy Protocol on Stacks**

> A self-sustaining on-chain cooperative where members save in BTC units, earn through contribution, borrow against trust, and govern their own economy.

[![CI](https://github.com/your-org/rexonobit/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/rexonobit/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

REXONOBIT is a decentralized cooperative credit protocol built on the Stacks blockchain, Bitcoin-settled and designed for real people — particularly in emerging markets where Susu, Tontines, and Chit Fund savings groups already operate at scale.

This is not a DEX. It is not an NFT marketplace. It is infrastructure: a permissionless, transparent, Bitcoin-secured cooperative economy.

---

## Feature Table

| Feature | Contract | Frontend Panel |
|---------|----------|----------------|
| Member registration & circles | `cooperative-registry` | CircleList |
| STX/sBTC savings with streak tracking | `savings-vault` | VaultPanel |
| Soulbound on-chain credit reputation | `trust-score` | TrustScoreCard |
| Circle-backed micro-loans | `lending-pool` | LoanPanel |
| On-chain gig board with attestation | `labor-market` | TaskBoard |
| Circle treasury with controls | `treasury` | TreasuryPanel |
| Trust-weighted on-chain governance | `governance` | GovernancePanel |
| Rotating savings & credit (ROSCA) | `rosca` | RoscaPanel |
| Soulbound milestone NFT badges | `reputation-nft` | BadgeGallery |
| Decentralized dispute resolution | `arbitration` | ArbitrationPanel |
| BTC-denominated synthetic credit line | `synthetic-credit` | SCreditPanel |
| Global protocol parameters & guards | `protocol-config` | — |

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

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| [Clarinet](https://docs.hiro.so/clarinet/getting-started) | ≥ 1.7.1 |
| [Node.js](https://nodejs.org/) | ≥ 18 |
| [Hiro Wallet](https://wallet.hiro.so/) | Latest |

### 1. Clone

```bash
git clone https://github.com/your-org/rexonobit.git
cd rexonobit
```

### 2. Smart contracts — check + test

```bash
clarinet check      # syntax validation
clarinet test       # run all Clarinet tests
clarinet integrate  # local devnet with all 12 contracts deployed
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env: set VITE_DEPLOYER_ADDRESS, VITE_NETWORK=testnet
npm install
npm run dev         # http://localhost:5173
```

### 4. Deploy to testnet

```bash
make deploy-testnet
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | Clarity 2, Stacks blockchain |
| Frontend | React 18 + TypeScript + Vite |
| Wallet | Hiro Wallet via `@stacks/connect` |
| Transactions | `@stacks/transactions` |
| Network reads | Stacks API (no backend required) |
| Deployment | Vercel (free tier) — zero infra cost |

---

## Security

- All private keys, mnemonics, and wallet files are gitignored
- `.env` is gitignored; only `.env.example` is committed
- See [SECURITY.md](SECURITY.md) for vulnerability reporting
- See [CONTRIBUTING.md](CONTRIBUTING.md) for dev guidelines

---

## Deployment Cost Estimate

| Item | Cost |
|---|---|
| 12 Clarity contracts | ~60 STX total |
| Per-user transaction | ~5000 microSTX (~$0.001) |
| Frontend hosting (Vercel) | $0 |
| Backend infrastructure | $0 (pure on-chain) |

---

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

---

## Roadmap

- **MVP (V1)**: `cooperative-registry`, `savings-vault`, `trust-score`, `lending-pool`, `rosca`
- **V2**: `labor-market`, `treasury`, `governance`, `arbitration`
- **V3**: `reputation-nft`, `synthetic-credit`, `protocol-config` DAO handoff

---

## License

MIT


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

---

## Test Suite

All 12 contracts have Clarinet test files in `tests/`:

| File | Description |
|------|-------------|
| `cooperative-registry.test.ts` | Member registration, circle create, vouch |
| `savings-vault.test.ts` | Deposit, withdraw, streak, lock |
| `trust-score.test.ts` | Reward, decay, tier thresholds |
| `lending-pool.test.ts` | Fund pool, request, repay, liquidate |
| `labor-market.test.ts` | Post, bid, accept, complete, attest |
| `treasury.test.ts` | Deposit, propose spend, vote, execute |
| `governance.test.ts` | Propose, vote, execute, veto |
| `rosca.test.ts` | Create, join, start, contribute, payout |
| `reputation-nft.test.ts` | Mint, tier, ownership |
| `arbitration.test.ts` | Open, join panel, verdict |
| `synthetic-credit.test.ts` | Mint, burn, transfer sCREDIT |
| `protocol-config.test.ts` | Initialize, set-param, admin upgrade |
| `rosca-lifecycle.test.ts` | ROSCA end-to-end lifecycle |
| `arbitration-lifecycle.test.ts` | Dispute end-to-end lifecycle |
| `integration.test.ts` | Cross-contract flows |

Run all tests:

```bash
clarinet test --costs    # also reports execution costs
```


---

## Test Suite

All 12 contracts have Clarinet test files in `tests/`:

| File | Description |
|------|-------------|
| `cooperative-registry.test.ts` | Member registration, circle create, vouch |
| `savings-vault.test.ts` | Deposit, withdraw, streak, lock |
| `trust-score.test.ts` | Reward, decay, tier thresholds |
| `lending-pool.test.ts` | Fund pool, request, repay, liquidate |
| `labor-market.test.ts` | Post, bid, accept, complete, attest |
| `treasury.test.ts` | Deposit, propose spend, vote, execute |
| `governance.test.ts` | Propose, vote, execute, veto |
| `rosca.test.ts` | Create, join, start, contribute, payout |
| `reputation-nft.test.ts` | Mint, tier, ownership |
| `arbitration.test.ts` | Open, join panel, verdict |
| `synthetic-credit.test.ts` | Mint, burn, transfer sCREDIT |
| `protocol-config.test.ts` | Initialize, set-param, admin upgrade |
| `rosca-lifecycle.test.ts` | ROSCA end-to-end lifecycle |
| `arbitration-lifecycle.test.ts` | Dispute end-to-end lifecycle |
| `integration.test.ts` | Cross-contract flows |

Run all tests:

```bash
clarinet test --costs    # also reports execution costs
```
