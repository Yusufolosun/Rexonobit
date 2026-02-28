# REXONOBIT

**Bitcoin-Native Cooperative Credit Protocol on Stacks**

> A self-sustaining on-chain cooperative where members save in BTC units, earn through contribution, borrow against trust, and govern their own economy.

[![Clarinet](https://img.shields.io/badge/Clarinet-v1.7.1-blue)](https://docs.hiro.so/clarinet/getting-started)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Stacks](https://img.shields.io/badge/Stacks-Epoch%202.4-blueviolet)](https://www.stacks.co/)

---

## What Is REXONOBIT?

REXONOBIT is a decentralized cooperative credit protocol built on the **Stacks blockchain**, Bitcoin-settled and designed for real people — particularly in emerging markets where **Susu**, **Tontines**, and **Chit Fund** savings groups already operate at scale.

This is not a DEX. It is not an NFT marketplace. It is **infrastructure**: a permissionless, transparent, Bitcoin-secured cooperative economy implemented entirely in 12 Clarity smart contracts with a React frontend and zero backend.

### Key Capabilities

- **Circle-based savings** — Members form cooperative circles, deposit STX, and build savings streaks
- **Soulbound credit reputation** — On-chain trust scores derived from savings consistency, loan repayment, and community participation
- **Micro-lending** — Circle-backed loans with interest rates governed by trust score, no external credit checks
- **ROSCA** — Rotating Savings & Credit Associations (Susu/Tontine) with automated cycle management
- **Labor market** — On-chain gig board with task posting, bidding, and multi-party attestation
- **Synthetic credit** — BTC-denominated credit lines backed by collateral and trust score
- **Decentralized governance** — Trust-weighted voting on protocol parameters, treasury spends, and member disputes
- **Soulbound NFT badges** — Non-transferable milestone achievements minted automatically

---

## Feature Map

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

## Architecture

### 12 Clarity Smart Contracts

| Contract | Clarity | Epoch | Description |
|---|---|---|---|
| `cooperative-registry` | 2 | 2.4 | Member registration, circle creation, vouching |
| `savings-vault` | 2 | 2.4 | STX savings with streak tracking and time-locks |
| `trust-score` | 2 | 2.4 | Soulbound credit reputation scoring (0–1000) |
| `lending-pool` | 2 | 2.4 | Circle-backed micro-lending with interest |
| `labor-market` | 2 | 2.4 | Task posting, bidding, acceptance, attestation |
| `treasury` | 2 | 2.4 | Circle treasury with proposal-based spend controls |
| `governance` | 2 | 2.4 | Trust-weighted proposal, vote, execute, veto |
| `rosca` | 2 | 2.4 | Rotating savings & credit association engine |
| `reputation-nft` | 2 | 2.4 | Soulbound milestone achievement NFTs |
| `arbitration` | 2 | 2.4 | Decentralized 3-member arbitration panels |
| `synthetic-credit` | 2 | 2.4 | BTC-denominated synthetic credit issuance |
| `protocol-config` | 2 | 2.4 | Global parameters and emergency controls |

### Contract Dependency Flow

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

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | Clarity 2, Stacks blockchain (Epoch 2.4) |
| Frontend | React 18 + TypeScript + Vite |
| Wallet integration | Hiro Wallet via `@stacks/connect` |
| Transaction building | `@stacks/transactions` |
| On-chain reads | Stacks API (no backend required) |
| Testing | Clarinet v1.7.1 (Deno) — 29 test files |
| Deployment | Vercel (frontend), Stacks mainnet/testnet (contracts) |

---

## Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Clarinet](https://docs.hiro.so/clarinet/getting-started) | ≥ 1.7.1 | Contract development, testing, devnet |
| [Node.js](https://nodejs.org/) | ≥ 18 | Frontend development |
| [Hiro Wallet](https://wallet.hiro.so/) | Latest | Browser wallet for transactions |

### 1. Clone & Enter

```bash
git clone https://github.com/Yusufolosun/Rexonobit.git
cd Rexonobit
```

### 2. Smart Contracts — Validate & Test

```bash
clarinet check          # Syntax validation for all 12 contracts
clarinet test           # Run all 29 test files
clarinet test --costs   # Run tests with execution cost reporting
clarinet integrate      # Launch local devnet with all contracts deployed
```

### 3. Frontend — Install & Run

```bash
cd frontend
cp .env.example .env    # Configure deployer address and network
npm install
npm run dev             # Development server at http://localhost:5173
```

### 4. Deploy to Testnet or Mainnet

```bash
make deploy-testnet     # Deploy all 12 contracts to Stacks testnet
make deploy-mainnet     # Deploy to mainnet (requires funded deployer)
```

---

## Configuration

Create `frontend/.env` from `frontend/.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_STACKS_NETWORK` | Yes | `testnet`, `mainnet`, or `devnet` |
| `VITE_DEPLOYER_ADDRESS` | Yes | STX address that deployed all 12 contracts |
| `VITE_APP_NAME` | No | App name shown in Hiro Wallet prompts |
| `VITE_APP_ICON_URL` | No | App icon URL for wallet prompts |
| `VITE_STACKS_API_URL` | No | Override Stacks API node URL |
| `VITE_EXPLORER_URL` | No | Explorer base URL for transaction links |

> **Warning:** Never commit `.env` — it is gitignored.

---

## Test Suite

29 Clarinet test files covering unit tests, integration tests, and lifecycle scenarios:

| Category | Files | Coverage |
|----------|-------|----------|
| Unit tests | 12 | One per contract — core function validation |
| Integration tests | 11 | Cross-contract interaction flows |
| Lifecycle tests | 5 | End-to-end scenarios (ROSCA, loans, arbitration, treasury, trust-score) |
| Full integration | 1 | Cross-system integration test |

```bash
clarinet test           # Run all tests
clarinet test --costs   # Include execution cost analysis
```

---

## Error Codes Reference

All contract errors are surfaced as `(err uXXX)` responses. Use `parseContractError()` from `src/lib/parseError.ts` to convert them to user-facing messages.

| Range | Contract | Example |
|-------|----------|---------|
| 100–109 | `cooperative-registry` | `u102` — Not a registered member |
| 200–205 | `savings-vault` | `u203` — Vault is locked |
| 300–308 | `lending-pool` | `u301` — Pool has insufficient liquidity |
| 400–410 | `rosca` | `u404` — Not a ROSCA member |
| 500–508 | `governance` | `u503` — Already voted on this proposal |
| 600–605 | `treasury` | `u603` — Spend amount exceeds treasury balance |
| 700–702 | `trust-score` | `u701` — Score update too frequent |
| 800–803 | `reputation-nft` | `u802` — Milestone requirements not met |
| 900–910 | `labor-market` | `u907` — Bid amount exceeds task budget |
| 1000–1007 | `arbitration` | `u1006` — Cannot dispute your own task |
| 1100–1104 | `synthetic-credit` | `u1100` — Insufficient collateral |
| 1200–1202 | `protocol-config` | `u1201` — Unauthorized, deployer only |

---

## Deployment Cost Estimate

| Item | Cost |
|---|---|
| 12 Clarity contracts (one-time) | ~60 STX total |
| Per-user transaction | ~5000 microSTX (~$0.001) |
| Frontend hosting (Vercel) | $0 |
| Backend infrastructure | $0 (pure on-chain) |

---

## Security

- All private keys, mnemonics, and wallet files are gitignored
- `.env` is gitignored; only `.env.example` is committed
- Clarinet `settings/Mainnet.toml` and `settings/Testnet.toml` are gitignored
- See [SECURITY.md](SECURITY.md) for vulnerability reporting
- See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines

---

## Documentation

Detailed documentation is available in the `docs/` directory:

- [Architecture Overview](docs/architecture.md) — System design and contract interactions
- [Loan Mechanics](docs/architecture/loan-mechanics.md) — Lending pool design and liquidation logic
- [ROSCA Mechanics](docs/architecture/rosca-mechanics.md) — Rotating savings cycle engine
- [Trust Score Algorithm](docs/architecture/trust-score-algorithm.md) — Reputation scoring formula
- [Governance Flow](docs/architecture/governance-flow.md) — Proposal lifecycle and vote weighting
- [Treasury Mechanics](docs/architecture/treasury-mechanics.md) — Circle treasury controls
- [Arbitration Mechanics](docs/architecture/arbitration-mechanics.md) — Dispute resolution process
- [Savings Vault Mechanics](docs/architecture/savings-vault-mechanics.md) — Deposit, withdraw, streaks
- [Labor Market Mechanics](docs/architecture/labor-market-mechanics.md) — Task lifecycle and attestation
- [Reputation NFT Mechanics](docs/architecture/reputation-nft-mechanics.md) — Soulbound badge minting
- [Synthetic Credit Mechanics](docs/architecture/synthetic-credit-mechanics.md) — Credit line issuance
- [Protocol Config Reference](docs/architecture/protocol-config-reference.md) — Global parameters

---

## Roadmap

| Phase | Contracts | Status |
|-------|-----------|--------|
| **V1 — MVP** | `cooperative-registry`, `savings-vault`, `trust-score`, `lending-pool`, `rosca` | Complete |
| **V2 — Economy** | `labor-market`, `treasury`, `governance`, `arbitration` | Complete |
| **V3 — Advanced** | `reputation-nft`, `synthetic-credit`, `protocol-config`, DAO handoff | Complete |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting issues, proposing changes, and submitting pull requests.

---

## License

[MIT](LICENSE)
