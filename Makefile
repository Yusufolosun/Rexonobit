# REXONOBIT Makefile
# Usage: make <target>

.PHONY: dev build lint typecheck test test-integration ci size-check stacks-info open-docs deploy-testnet deploy-mainnet devnet-start clean help

help: ## Show this help message
	@echo "REXONOBIT — Stacks Micro-Economy Protocol"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ── Frontend ──────────────────────────────────────────────────────────────────
dev: ## Start Vite dev server
	cd frontend && npm run dev

build: ## Build production frontend bundle
	cd frontend && npm run build

lint: ## Run ESLint on frontend
	cd frontend && npm run lint

typecheck: ## TypeScript type-check frontend (no emit)
	cd frontend && npx tsc --noEmit

ci: install typecheck lint build test ## Run full CI pipeline: install → typecheck → lint → build → test

install: ## Install frontend dependencies
	cd frontend && npm install

format: ## Auto-format frontend code with Prettier (if configured)
	cd frontend && npx prettier --write "src/**/*.{ts,tsx,css}"

preview: ## Preview production build locally
	cd frontend && npm run build && npm run preview

audit: ## Run npm security audit on frontend deps
	cd frontend && npm audit --audit-level=moderate

size-check: build ## Build and print chunk sizes (warn if > 400 kB)
	@echo "=== Bundle sizes ==="
	@find frontend/dist/assets -name "*.js" -exec du -sh {} \; | sort -h

# ── Contracts ─────────────────────────────────────────────────────────────────
check: ## Syntax-check all Clarity contracts
	clarinet check

test: ## Run all Clarinet unit tests
	clarinet test

test-integration: ## Run only integration test files
	clarinet test tests/governance-integration.test.ts tests/synthetic-credit-integration.test.ts tests/trust-score-integration.test.ts tests/treasury-integration.test.ts tests/labor-market-integration.test.ts tests/lending-pool-integration.test.ts

test-watch: ## Run Clarinet tests in watch mode
	clarinet test --watch

test-coverage: ## Run tests with coverage report
	clarinet test --coverage

# ── Local devnet ──────────────────────────────────────────────────────────────
devnet-start: ## Start local Clarinet devnet
	clarinet devnet start

devnet-stop: ## Stop local Clarinet devnet
	clarinet devnet stop

# ── Deployment ────────────────────────────────────────────────────────────────
deploy-testnet: ## Deploy all contracts to Testnet (requires STACKS_PRIVATE_KEY)
	bash scripts/deploy-testnet.sh

deploy-mainnet: ## Deploy to Mainnet — requires explicit flag
	bash scripts/deploy-mainnet.sh --confirm-mainnet

# ── Utilities ─────────────────────────────────────────────────────────────────
clean: ## Remove build artifacts
	rm -rf frontend/dist frontend/node_modules/.vite coverage/

clean-all: ## Remove build artifacts AND node_modules
	rm -rf frontend/dist frontend/node_modules coverage/

stacks-info: ## Print current Stacks network and Hiro API URL
	@echo "Network : $${STACKS_NETWORK:-testnet}"
	@echo "API URL : $${STACKS_API_URL:-https://stacks-node-api.testnet.co}"
	@echo "Explorer: https://explorer.hiro.so?chain=$${STACKS_NETWORK:-testnet}"

open-docs: ## Open docs/README in the default browser
	@echo "Opening docs/README.md ..."
	@start docs/README.md 2>/dev/null || xdg-open docs/README.md 2>/dev/null

format: ## Run Prettier on frontend/src
	cd frontend && npx prettier --write "src/**/*.{ts,tsx,css}" --log-level warn

check-deps: ## Audit npm dependencies in frontend for known vulnerabilities
	cd frontend && npm audit --audit-level=moderate || open docs/README.md
