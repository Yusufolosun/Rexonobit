# REXONOBIT

**Bitcoin-Native Cooperative Credit Protocol on Stacks**

A decentralized cooperative economy protocol built on the [Stacks](https://www.stacks.co/) blockchain — 12 Clarity smart contracts, a React frontend, and zero backend infrastructure. Members form cooperative circles, save in STX, build on-chain credit reputation, borrow against trust, work gig jobs with multi-party attestation, and govern their own economy through trust-weighted voting.

[![Clarinet](https://img.shields.io/badge/Clarinet-v1.7.1-blue)](https://docs.hiro.so/clarinet/getting-started)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Stacks](https://img.shields.io/badge/Stacks-Epoch%202.4-blueviolet)](https://www.stacks.co/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Error Codes](#error-codes)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

REXONOBIT targets communities — particularly in emerging markets — where informal savings groups (**Susu**, **Tontines**, **Chit Funds**) already operate at scale. It replaces trust-based paper ledgers with transparent, Bitcoin-settled smart contracts.

This is not a DEX. It is not an NFT marketplace. It is **cooperative financial infrastructure**: permissionless, auditable, and fully on-chain with no backend servers.

### Project Metrics

| Metric | Value |
|--------|-------|
| Smart contracts | 12 Clarity 2 contracts (~2,900 LOC) |
| Frontend | 101 TypeScript/React source files (~10,800 LOC) |
| Test suite | 30 test files (~5,500 LOC) |
| Backend | None — pure on-chain reads via Stacks API |

---

## Features

| Feature | Contract | Description |
|---------|----------|-------------|
| Member registration & circles | `cooperative-registry` | Create/join cooperatives, vouch for members |
| STX savings with streaks | `savings-vault` | Time-locked deposits with streak tracking |
| Soulbound credit reputation | `trust-score` | On-chain reputation score (0–1000) from savings, repayments, participation |
| Circle-backed micro-loans | `lending-pool` | Borrow against trust score — no external credit checks |
| Rotating savings (ROSCA) | `rosca` | Automated Susu/Tontine cycle management |
| Gig board with attestation | `labor-market` | Post tasks, bid, accept, multi-party work attestation |
| Circle treasury | `treasury` | Proposal-based spend controls for cooperative funds |
| Trust-weighted governance | `governance` | Proposal → vote → execute → veto lifecycle |
| Soulbound NFT badges | `reputation-nft` | Non-transferable milestone achievement NFTs |
| Dispute resolution | `arbitration` | Decentralized 3-member arbitration panels |
| Synthetic credit | `synthetic-credit` | BTC-denominated credit lines backed by collateral + trust |
| Protocol parameters | `protocol-config` | Global configuration and emergency controls |

---

## Architecture

### Contract Dependency Graph

```
[cooperative-registry] ─── member exists? ──────────────────────┐
         │                                                       │
         ▼                                                       ▼
[savings-vault] + [rosca] ──── feeds ──── [trust-score] ──── [reputation-nft]
         │                                     │
         ▼                                     ▼
   [lending-pool] ◄─── checks ───── [trust-score]
         │                                     │
         ▼                                     ▼
   [labor-market] ──── disputes ──── [arbitration]
         │                                     │
         ▼                                     ▼
    [treasury] ◄──── governed by ──── [governance]
                                                │
[protocol-config] ─── parameters for all ───────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | Clarity 2 — Stacks blockchain (Epoch 2.4) |
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| Wallet | [Hiro Wallet](https://wallet.hiro.so/) via `@stacks/connect` |
| Transactions | `@stacks/transactions` for contract calls |
| On-chain reads | Stacks Blockchain API (no server required) |
| Testing | Clarinet v1.7.1 (Deno runtime) |
| CI/CD | GitHub Actions (typecheck, lint, build, test, CodeQL, audit) |
| Deployment | Vercel (frontend), Stacks mainnet/testnet (contracts) |

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| [Clarinet](https://docs.hiro.so/clarinet/getting-started) | ≥ 1.7.1 | `brew install clarinet` or [installer](https://github.com/hirosystems/clarinet/releases) |
| [Node.js](https://nodejs.org/) | ≥ 18 | `nvm install 18` or [download](https://nodejs.org/) |
| [Hiro Wallet](https://wallet.hiro.so/) | Latest | Browser extension |

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Yusufolosun/Rexonobit.git
cd Rexonobit
```

### 2. Validate Smart Contracts

```bash
clarinet check                # Syntax validation for all 12 contracts
clarinet console              # Launch interactive Clarity REPL
```

### 3. Run Tests

```bash
clarinet test                 # Run all 30 test files
clarinet test --costs         # With execution cost reporting
clarinet test --coverage      # With coverage report
```

### 4. Start the Frontend

```bash
cd frontend
cp .env.example .env          # Configure deployer address and network
npm install
npm run dev                   # http://localhost:5173
```

### 5. Start Local Devnet

```bash
clarinet devnet start         # Deploys all 12 contracts to local devnet
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

## Testing

30 Clarinet test files organized into three categories:

| Category | Count | Purpose |
|----------|-------|---------|
| Unit tests | 12 | One per contract — core function validation |
| Integration tests | 12 | Cross-contract interaction flows |
| Lifecycle tests | 6 | End-to-end scenarios (ROSCA, loans, arbitration, treasury, trust-score, lending) |

### Makefile Targets

```bash
make check              # Syntax-check all Clarity contracts
make test               # Run all Clarinet tests
make test-integration   # Run only integration test files
make typecheck          # TypeScript type-check (frontend)
make lint               # ESLint (frontend)
make ci                 # Full pipeline: install → typecheck → lint → build → test
```

---

## Deployment

### Testnet

```bash
make deploy-testnet     # Requires STACKS_PRIVATE_KEY env variable
```

### Mainnet

```bash
make deploy-mainnet     # Requires --confirm-mainnet flag and funded deployer
```

### Cost Estimate

| Item | Estimated Cost |
|------|---------------|
| 12 contract deployments (one-time) | ~60 STX |
| Per-user transaction | ~5,000 µSTX (~$0.001) |
| Frontend hosting (Vercel) | Free |
| Backend | None |

---

## Project Structure

```
Rexonobit/
├── contracts/              # 12 Clarity smart contracts
│   ├── protocol-config.clar
│   ├── cooperative-registry.clar
│   ├── savings-vault.clar
│   ├── trust-score.clar
│   ├── lending-pool.clar
│   ├── labor-market.clar
│   ├── treasury.clar
│   ├── governance.clar
│   ├── rosca.clar
│   ├── reputation-nft.clar
│   ├── arbitration.clar
│   └── synthetic-credit.clar
├── tests/                  # 30 Clarinet test files (Deno/TypeScript)
├── frontend/
│   └── src/
│       ├── components/     # React UI components
│       ├── hooks/          # Custom React hooks
│       ├── context/        # React context providers (Wallet, Toast, Notifications)
│       └── lib/            # Utilities (format, math, api, errors, datetime)
├── docs/                   # Architecture docs, component docs, hook docs
├── scripts/                # Deployment scripts (testnet, mainnet)
├── settings/               # Clarinet network configs
├── Clarinet.toml           # Contract manifest
├── Makefile                # Build/test/deploy automation
└── .github/workflows/      # CI: typecheck, lint, build, test, CodeQL, audit
```

---

## Error Codes

All contract errors follow the `(err uXXX)` pattern. Use `parseContractError()` from `frontend/src/lib/parseError.ts` to map error codes to user-facing messages.

| Range | Contract | Example |
|-------|----------|---------|
| 100–109 | `cooperative-registry` | `u102` — Not a registered member |
| 200–205 | `savings-vault` | `u203` — Vault is locked |
| 300–308 | `lending-pool` | `u301` — Pool has insufficient liquidity |
| 400–410 | `rosca` | `u404` — Not a ROSCA member |
| 500–508 | `governance` | `u503` — Already voted on this proposal |
| 600–605 | `treasury` | `u603` — Spend exceeds treasury balance |
| 700–702 | `trust-score` | `u701` — Score update too frequent |
| 800–803 | `reputation-nft` | `u802` — Milestone requirements not met |
| 900–910 | `labor-market` | `u907` — Bid exceeds task budget |
| 1000–1007 | `arbitration` | `u1006` — Cannot dispute own task |
| 1100–1104 | `synthetic-credit` | `u1100` — Insufficient collateral |
| 1200–1202 | `protocol-config` | `u1201` — Unauthorized, deployer only |

---

## Security

- All private keys, mnemonics, and wallet files are gitignored
- `.env` files are never committed — only `.env.example` is tracked
- Clarinet `settings/Mainnet.toml` and `settings/Testnet.toml` are gitignored
- GitHub Actions runs `npm audit` and [Gitleaks](https://github.com/gitleaks/gitleaks) on every push
- [CodeQL](https://codeql.github.com/) static analysis runs on push and weekly schedule

For vulnerability reporting, see [SECURITY.md](SECURITY.md).

---

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **V1 — Core** | `cooperative-registry`, `savings-vault`, `trust-score`, `lending-pool`, `rosca` | ✅ Complete |
| **V2 — Economy** | `labor-market`, `treasury`, `governance`, `arbitration` | ✅ Complete |
| **V3 — Advanced** | `reputation-nft`, `synthetic-credit`, `protocol-config` | ✅ Complete |
| **V4 — Audit & Launch** | Third-party audit, mainnet deployment, DAO handoff | Planned |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, contract conventions, commit guidelines, and pull request process.

---

## Documentation

Detailed architecture and API documentation is in the [`docs/`](docs/) directory:

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/architecture.md) | System design, contract interactions, data flow |
| [Loan Mechanics](docs/architecture/loan-mechanics.md) | Lending pool design, interest calculation, liquidation |
| [ROSCA Mechanics](docs/architecture/rosca-mechanics.md) | Rotating savings cycle engine |
| [Trust Score Algorithm](docs/architecture/trust-score-algorithm.md) | Reputation scoring formula and weight breakdown |
| [Governance Flow](docs/architecture/governance-flow.md) | Proposal lifecycle, vote weighting, veto mechanics |
| [Treasury Mechanics](docs/architecture/treasury-mechanics.md) | Circle treasury controls and spend proposals |
| [Arbitration Mechanics](docs/architecture/arbitration-mechanics.md) | Dispute resolution process |
| [Savings Vault Mechanics](docs/architecture/savings-vault-mechanics.md) | Deposit, withdraw, streak tracking |
| [Labor Market Mechanics](docs/architecture/labor-market-mechanics.md) | Task lifecycle and attestation flow |
| [Reputation NFT Mechanics](docs/architecture/reputation-nft-mechanics.md) | Soulbound badge minting criteria |
| [Synthetic Credit Mechanics](docs/architecture/synthetic-credit-mechanics.md) | Credit line issuance and collateral |
| [Protocol Config Reference](docs/architecture/protocol-config-reference.md) | Global parameter registry |

---

## License

[MIT](LICENSE)
