# Contributing to REXONOBIT

Thank you for your interest in contributing to REXONOBIT — a Bitcoin-native micro-economy protocol built on Stacks.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Contract Development](#contract-development)
4. [Frontend Development](#frontend-development)
5. [Testing](#testing)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| [Clarinet](https://github.com/hirosystems/clarinet) | ≥ 1.7.1 |
| Node.js | ≥ 18 |
| npm | ≥ 9 |

### Clone and install

```bash
git clone https://github.com/Yusufolosun/Rexonobit.git
cd Rexonobit
cd frontend && npm install
```

---

## Development Workflow

```
main branch  ──►  feature/xxx  ──►  PR review  ──►  squash merge
```

1. Branch from `main`: `git checkout -b feat/my-feature`
2. Make **atomic commits** — one logical change per commit
3. Run tests before opening a PR
4. Open a PR with a clear description

---

## Contract Development

All Clarity contracts live in `contracts/`. The protocol configuration entry point is `protocol-config.clar`.

```bash
# Check contract syntax
clarinet check

# Run all Clarinet tests
clarinet test

# Run a single test file
clarinet test tests/savings-vault.test.ts

# Launch the REPL
clarinet console
```

### Contract conventions

- Use `(err u<code>)` error patterns — see `frontend/src/lib/constants.ts` for the error code registry
- Public functions that change state must emit an event or return an `ok`
- Read-only functions never modify state
- Every new contract must have a corresponding test file in `tests/`

---

## Frontend Development

The React frontend lives in `frontend/`.

```bash
cd frontend

# Start dev server
npm run dev

# Type-check
npm run build

# Lint
npm run lint
```

### Architecture layers

```
components/   ← React UI components (panels, cards, shared)
hooks/        ← Custom data-fetching hooks (useVault, useLoan, …)
lib/          ← Pure utilities (read.ts, transactions.ts, network.ts, validators.ts, constants.ts, explorer.ts)
context/      ← React context providers (WalletContext, ToastContext)
```

### Key patterns

- **Data fetching**: use custom hooks (`useVault`, `useLoan`, etc.) — never fetch directly in components
- **Form inputs**: use `useFormField` + `FormInput` for validated inputs
- **Transactions**: use functions from `lib/transactions.ts` which wrap `@stacks/connect`
- **Toast notifications**: call `useToast()` and fire `addToast(...)` — never use `alert()`
- **Window focus refresh**: call `useWindowFocus(refresh)` in every panel that fetches data

---

## Testing

### Clarinet (contract) tests

Tests use Deno + Clarinet test runner. Each contract has a dedicated test file.

```bash
clarinet test              # all tests
clarinet test --watch      # watch mode
```

Test files follow this pattern:

```typescript
import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

Clarinet.test({
  name: "describe what you test",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const block = chain.mineBlock([
      Tx.contractCall("my-contract", "my-function", [types.uint(1)], accounts.get("wallet_1")!.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});
```

### Devnet

```bash
clarinet integrate   # spin up local devnet with all contracts deployed
```

---

## Commit Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructure with no functional change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Build, CI, config changes |
| `style` | Formatting, no logic change |

**Examples:**
```
feat(contracts): add lock-savings function to savings-vault
fix(frontend): correct STX micro-unit conversion in VaultPanel
test(contracts): add ROSCA lifecycle integration test
perf(frontend): memo-ize filtered transactions in TxHistory
```

---

## Pull Request Process

1. Ensure contracts pass validation: `make check`
2. Ensure all tests pass: `make test`
3. Ensure the frontend compiles and lints cleanly:
   ```bash
   make typecheck
   make lint
   make build
   ```
4. Or run the full CI pipeline locally: `make ci`
5. Fill out the PR template
6. Request review from at least one maintainer
7. PRs are squash-merged into `main`
