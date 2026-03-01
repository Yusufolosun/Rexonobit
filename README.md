# REXONOBIT

**Bitcoin-Native Cooperative Credit Protocol on Stacks**

A decentralized cooperative economy protocol built on the [Stacks](https://www.stacks.co/) blockchain. Members form cooperative circles, pool savings in STX, build on-chain credit reputation, borrow against trust, work gig jobs with multi-party attestation, and govern their own economy through trust-weighted voting — all without backend servers or off-chain dependencies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Stacks](https://img.shields.io/badge/Stacks-Epoch%202.4-blueviolet)](https://www.stacks.co/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Tests-56%20passing-brightgreen)]()

---

## Table of Contents

- [What is Rexonobit?](#what-is-rexonobit)
- [Protocol Features](#protocol-features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Error Codes](#error-codes)
- [Security](#security)
- [Roadmap](#roadmap)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## What is Rexonobit?

Rexonobit targets communities — particularly in emerging markets — where informal savings groups (**Susu**, **Tontines**, **Chit Funds**) already operate at scale. It replaces trust-based paper ledgers with transparent, Bitcoin-settled smart contracts.

This is not a DEX, a lending aggregator, or an NFT marketplace. It is **cooperative financial infrastructure**: permissionless, auditable, and fully on-chain.

### Why Stacks?

Stacks settles on Bitcoin L1 while providing expressive smart contracts via [Clarity](https://docs.stacks.co/clarity/overview). Rexonobit exploits this to give cooperatives Bitcoin-grade finality without the gas costs of Ethereum or the trust assumptions of L2 sidechains.

### At a Glance

| Metric | Value |
|--------|-------|
| Smart contracts | 12 Clarity v2 contracts (~3,100 LOC) |
| Frontend | 102 TypeScript / React source files |
| Test suite | 7 test files — 56 tests passing (Clarinet SDK v3 + vitest) |
| Backend | None — pure on-chain reads via Stacks API |

---

## Protocol Features

| Feature | Contract | What it Does |
|---------|----------|--------------|
| Cooperative circles | `cooperative-registry` | Create / join cooperatives, vouch for members, manage circle membership |
| STX savings with streaks | `savings-vault` | Time-locked deposits with consecutive-deposit streak tracking |
| On-chain credit reputation | `trust-score` | Composite reputation score (0–1 000) derived from savings, repayments, and participation |
| Circle-backed micro-loans | `lending-pool` | Borrow against trust score — no external credit bureau required |
| Rotating savings (ROSCA) | `rosca` | Automated Susu / Tontine cycle management with payout rotation |
| Gig board & attestation | `labor-market` | Post tasks, bid, accept, multi-party work attestation |
| Circle treasury | `treasury` | Proposal-based spend controls for cooperative funds |
| Trust-weighted governance | `governance` | Full proposal lifecycle: create → vote → execute → veto |
| Soulbound NFT badges | `reputation-nft` | Non-transferable milestone achievement NFTs (SIP-009 compatible) |
| Dispute resolution | `arbitration` | Decentralized 3-member arbitration panels with stake-weighted voting |
| Synthetic credit lines | `synthetic-credit` | BTC-denominated credit backed by collateral + trust score |
| Protocol parameters | `protocol-config` | Global configuration registry and emergency pause controls |

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

Every contract that mutates financial state checks membership via `cooperative-registry` and, where applicable, validates trust via `trust-score`. `protocol-config` provides tunable parameters (interest rates, quorum thresholds, cooldown periods) and an emergency pause switch honoured by all contracts.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | Clarity v2 — Stacks blockchain (Epoch 2.4) |
| Contract testing | Clarinet SDK v3 (`@stacks/clarinet-sdk`) + vitest 3 |
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| Wallet integration | [Hiro Wallet](https://wallet.hiro.so/) via `@stacks/connect` |
| Transactions | `@stacks/transactions` for contract calls |
| On-chain reads | Stacks Blockchain API — no backend server required |
| CI/CD | GitHub Actions (typecheck, lint, build, test, CodeQL, audit) |

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| [Clarinet](https://docs.hiro.so/clarinet/getting-started) | Latest | `brew install clarinet` or [releases](https://github.com/hirosystems/clarinet/releases) |
| [Node.js](https://nodejs.org/) | ≥ 18 | `nvm install 18` or [download](https://nodejs.org/) |
| [npm](https://www.npmjs.com/) | ≥ 9 | Ships with Node.js |
| [Hiro Wallet](https://wallet.hiro.so/) | Latest | Browser extension (for frontend interaction) |

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/Yusufolosun/Rexonobit.git
cd Rexonobit
npm install            # Install test dependencies (vitest, clarinet-sdk)
```

### 2. Validate contracts

```bash
clarinet check         # Syntax-check all 12 Clarity contracts
clarinet console       # Launch interactive Clarity REPL
```

### 3. Run the test suite

```bash
npx vitest run         # Run all 56 tests across 7 test files
npx vitest run --reporter=verbose   # Verbose output
```

### 4. Start the frontend

```bash
cd frontend
cp .env.example .env   # Configure deployer address and network
npm install
npm run dev            # http://localhost:5173
```

### 5. Local devnet

```bash
clarinet devnet start  # Deploys all 12 contracts to a local Stacks devnet
```

---

## Testing

The test suite uses **Clarinet SDK v3** with **vitest** (forked process pool). All tests run against a simulated Stacks network — no external nodes required.

| Test File | Scope |
|-----------|-------|
| `protocol-config.test.ts` | Global parameters, pause/unpause, access control |
| `cooperative-registry.test.ts` | Circle creation, membership, vouching, suspension |
| `trust-score.test.ts` | Score updates, category weights, pause guards |
| `savings-vault.test.ts` | Deposits, withdrawals, streak tracking |
| `lending-pool.test.ts` | Loan origination, repayment, interest, max-loan formula |
| `synthetic-credit.test.ts` | Credit line issuance, collateral management |
| `integration.test.ts` | Cross-contract flows (registration → savings → trust → loans) |

```bash
npx vitest run                     # Run all tests
npx vitest run tests/lending-pool  # Run a single file
npx vitest --watch                 # Watch mode during development
```

> 31 legacy Deno-era test files are preserved in `tests/legacy/` for reference but are not part of the active test suite.

### Makefile Shortcuts

```bash
make check          # clarinet check
make test           # npx vitest run
make typecheck      # TypeScript type-check (frontend)
make lint           # ESLint (frontend)
make ci             # Full pipeline: install → typecheck → lint → build → test
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

> **Warning:** Never commit `.env` — it is gitignored. Only `.env.example` is tracked.

---

## Deployment

### Testnet

```bash
make deploy-testnet     # Requires STACKS_PRIVATE_KEY env variable
```

### Mainnet

```bash
make deploy-mainnet     # Requires --confirm-mainnet flag and a funded deployer wallet
```

> Private keys are **never** stored in source files. Deployment scripts read credentials exclusively from environment variables.

---

## Project Structure

```
Rexonobit/
├── contracts/              # 12 Clarity v2 smart contracts
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
├── tests/                  # 7 active vitest test files (56 tests)
│   └── legacy/             # 31 archived Deno-era test files
├── frontend/
│   └── src/
│       ├── components/     # React UI components
│       ├── hooks/          # Custom React hooks
│       ├── context/        # React context providers (Wallet, Toast, Notifications)
│       └── lib/            # Utilities (format, math, api, errors, datetime)
├── docs/                   # Architecture docs, component docs, hook docs
├── scripts/                # Deployment scripts (testnet, mainnet)
├── settings/               # Network configs (only Devnet.toml is tracked)
├── Clarinet.toml           # Contract manifest
├── vitest.config.ts        # Test runner configuration
├── Makefile                # Build / test / deploy automation
└── package.json            # Root dependencies (clarinet-sdk, vitest)
```

---

## Error Codes

All contract errors follow the `(err uXXX)` pattern. The frontend's `parseContractError()` utility maps numeric codes to user-facing messages.

| Range | Contract |
|-------|----------|
| u100 – u116 | `cooperative-registry` |
| u200 – u210 | `savings-vault` |
| u300 – u306 | `trust-score` |
| u400 – u414 | `lending-pool` |
| u500 – u514 | `labor-market` |
| u600 – u613 | `treasury` |
| u700 – u712 | `governance` |
| u800 – u815 | `rosca` |
| u900 – u907 | `reputation-nft` |
| u1000 – u1005 | `protocol-config` |
| u1000 – u1012 | `arbitration` |
| u1100 – u1109 | `synthetic-credit` |

> `protocol-config` and `arbitration` share the u1000 range. Codes are disambiguated by the contract principal in the error response.

---

## Security

Rexonobit treats key material protection as a first-class concern:

- **Private keys, mnemonics, seed phrases, and wallet files** are covered by 15+ gitignore rules — they cannot be accidentally committed
- **`.env` files** are never tracked; only `.env.example` templates are committed
- **Network configs** — `settings/Mainnet.toml` and `settings/Testnet.toml` are gitignored; only `Devnet.toml` (local-only, no real keys) is tracked
- **Deployment scripts** read credentials exclusively from environment variables — no hardcoded secrets
- **CI/CD** runs `npm audit` and [Gitleaks](https://github.com/gitleaks/gitleaks) on every push to detect leaked secrets
- **[CodeQL](https://codeql.github.com/)** static analysis runs on push and on a weekly schedule

For responsible vulnerability disclosure, see [SECURITY.md](SECURITY.md).

---

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **V1 — Core** | `cooperative-registry`, `savings-vault`, `trust-score`, `lending-pool`, `rosca` | ✅ Complete |
| **V2 — Economy** | `labor-market`, `treasury`, `governance`, `arbitration` | ✅ Complete |
| **V3 — Advanced** | `reputation-nft`, `synthetic-credit`, `protocol-config` | ✅ Complete |
| **V4 — Audit & Launch** | Third-party security audit, mainnet deployment, DAO handoff | Planned |

---

## Documentation

Detailed architecture and protocol mechanics documentation lives in the [`docs/`](docs/) directory:

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, contract conventions, commit guidelines, and pull request process.

---

## License

[MIT](LICENSE)
