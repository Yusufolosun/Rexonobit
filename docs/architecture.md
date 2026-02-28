# REXONOBIT — Architecture Overview

## Protocol Summary

REXONOBIT is a Bitcoin-native micro-economy protocol deployed on the Stacks blockchain. It enables cooperative savings circles, peer-lending, ROSCA (Rotating Savings and Credit Association), decentralized labor markets, governance, and dispute arbitration — all settled with Bitcoin finality via Stacks.

---

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          Browser (React + Vite)                    │
│                                                                     │
│   WalletContext  ──►  @stacks/connect  ──►  Hiro Wallet            │
│   ToastContext   ──►  ToastContainer                               │
│                                                                     │
│   Panels ──► Hooks ──► lib/transactions.ts ──► @stacks/connect     │
│                  └──► lib/read.ts         ──► Hiro API             │
└─────────────────────────────────────┬──────────────────────────────┘
                                      │ HTTP (Stacks API)
┌─────────────────────────────────────▼──────────────────────────────┐
│                        Stacks Blockchain                            │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                    protocol-config.clar                       │ │
│   │   (single initialize, admin param store, upgrade authority)   │ │
│   └───────────┬──────────────┬───────────────────────────────────┘ │
│               │              │                                      │
│   ┌───────────▼──────┐  ┌───▼──────────────┐  ┌─────────────────┐ │
│   │ cooperative-     │  │ savings-vault     │  │ lending-pool    │ │
│   │ registry.clar    │  │ .clar             │  │ .clar           │ │
│   │ (member mgmt)    │  │ (deposit/lock)    │  │ (loans/repay)   │ │
│   └───────────┬──────┘  └───────────────────┘  └─────────────────┘ │
│               │                                                      │
│   ┌───────────▼──────┐  ┌───────────────────┐  ┌─────────────────┐ │
│   │ trust-score.clar │  │ rosca.clar         │  │ labor-market    │ │
│   │ (scoring engine) │  │ (ROSCA circles)    │  │ .clar           │ │
│   └───────────┬──────┘  └───────────────────┘  └─────────────────┘ │
│               │                                                      │
│   ┌───────────▼──────┐  ┌───────────────────┐  ┌─────────────────┐ │
│   │ reputation-nft   │  │ synthetic-credit   │  │ treasury.clar   │ │
│   │ .clar (SIP-009)  │  │ .clar (sCREDIT ft) │  │ (fee mgmt)      │ │
│   └──────────────────┘  └───────────────────┘  └─────────────────┘ │
│                                                                      │
│   ┌──────────────────┐  ┌───────────────────┐                       │
│   │ governance.clar  │  │ arbitration.clar   │                       │
│   │ (proposals/vote) │  │ (dispute panels)   │                       │
│   └──────────────────┘  └───────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Contract Dependency Graph

```
protocol-config
    └── ALL contracts read params from this

cooperative-registry
    ├── savings-vault   (checks membership)
    ├── lending-pool    (checks membership)
    ├── rosca           (checks membership)
    ├── labor-market    (checks membership)
    ├── governance      (checks membership)
    └── arbitration     (checks membership)

trust-score
    ├── (read by) lending-pool   → credit scoring for loan eligibility
    ├── (read by) synthetic-credit → sCREDIT mint eligibility
    ├── (written by) savings-vault  → savings points
    ├── (written by) lending-pool   → loan repayment points
    ├── (written by) labor-market   → task completion points
    └── (written by) arbitration    → penalty deductions

savings-vault
    └── (collateral reference) lending-pool

treasury
    ├── (fee recipient) lending-pool
    ├── (fee recipient) labor-market
    └── (fee recipient) rosca

reputation-nft
    └── (mint trigger) trust-score  → tier upgrades mint NFT badges

synthetic-credit
    └── (eligibility) trust-score + savings-vault locked balance
```

---

## Frontend Layer Map

### `frontend/src/lib/`

| File | Responsibility |
|------|---------------|
| `network.ts` | Stacks network instance, `STACKS_API_URL`, `NETWORK_TYPE` |
| `wallet.ts` | Connect/disconnect wallet via `@stacks/connect` |
| `transactions.ts` | All contract-call submission functions (openContractCall wrappers) |
| `read.ts` | All read-only contract call functions (callReadOnlyFunction wrappers) |
| `validators.ts` | Pure validation functions (validateSTX, validatePrincipal, …) |
| `constants.ts` | CONTRACT_NAMES, ERROR_CODES, TRUST_TIER_THRESHOLDS, STX helpers |
| `explorer.ts` | Network-aware Hiro Explorer URL generators |

### `frontend/src/hooks/`

| Hook | Fetches |
|------|---------|
| `useVault` | Vault balance, locked balance, streak |
| `useLoan` | Active loan, pool balance |
| `useRosca` | Circle list, contribution state |
| `useTask` | Task list, bid state |
| `useTrustScore` | Decomposed trust score (savings, loan, labor, endorsement, penalty) |
| `useSCredit` | sCREDIT balance, credit limit, utilization, trust score, locked savings |
| `useCircle` | Cooperative registry circle data |
| `useFormField` | Controlled input with validation |
| `useWindowFocus` | Fires a callback when the browser tab regains focus |

### `frontend/src/context/`

| Context | Purpose |
|---------|---------|
| `WalletContext` | Stacks address, connected state, connect/disconnect |
| `ToastContext` | Global toast queue and `addToast()` helper |

---

## Transaction Flow

```
User interaction
    │
    ▼
Panel component
    │  calls hook action (e.g. handleDeposit)
    ▼
lib/transactions.ts
    │  openContractCall({ ... }) from @stacks/connect
    ▼
Hiro Wallet extension
    │  user signs
    ▼
Stacks Mempool
    │  anchor block mined (≈10 min on mainnet, ~30 s on devnet)
    ▼
Contract execution
    │
    ▼
ToastContainer shows txid link → Hiro Explorer
```

---

## Data Flow (Read)

```
Component mounts / window focus
    │
    ▼
Custom hook (e.g. useVault)
    │  calls lib/read.ts functions
    ▼
callReadOnlyFunction (from @stacks/transactions)
    │  HTTP GET → Stacks API /v2/contracts/call-read
    ▼
Clarity contract read-only fn
    │  returns ClarityValue
    ▼
cvToValue() deserialization
    │
    ▼
Hook returns typed state
    │
    ▼
Component renders
```

---

## Deployment

| Environment | Command | Network param |
|-------------|---------|---------------|
| Devnet | `clarinet integrate` | devnet |
| Testnet | `make deploy-testnet` | testnet |
| Mainnet | `make deploy-mainnet` | mainnet |

See [scripts/deploy-testnet.sh](../scripts/deploy-testnet.sh) and [scripts/deploy-mainnet.sh](../scripts/deploy-mainnet.sh) for details.

---

## Key Design Decisions

1. **Single config contract** — `protocol-config` holds all tunable parameters (min deposit, max loan, fee rate). No magic numbers scattered across contracts.
2. **Trust-score as middleware** — Trust score acts as the credit layer between behavior (savings, repayment, task completion) and eligibility (loans, sCREDIT).
3. **sCREDIT gated by collateral** — Synthetic credit can only be minted up to the locked savings collateral × trust multiplier, preventing uncollateralised issuance.
4. **Arbitration as final recourse** — Labor market disputes escalate to a 3-of-5 arbitration panel rather than an admin key.
5. **Hook-per-contract architecture** — One React hook per contract ensures clean data boundaries and easy testing.
