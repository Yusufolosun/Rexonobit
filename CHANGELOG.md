# Changelog

All notable changes to REXONOBIT are documented here.

This project follows [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

---

## [Unreleased]

### Added
- `ProtocolStats` component — protocol-wide aggregate metrics (total members, circles, pool balance, treasury)
- `ThemeToggle` component — dark/light mode toggle with localStorage persistence
- `useTheme` hook — `data-theme` attribute toggle on `<html>` element
- `useWindowFocus` hook — triggers data refresh when browser tab regains focus
- Light theme CSS variables via `[data-theme="light"]` selector
- `lib/constants.ts` — `CONTRACT_NAMES`, `ERROR_CODES`, `TRUST_TIER_THRESHOLDS`, STX helpers
- `lib/explorer.ts` — `explorerTxUrl`, `explorerAddressUrl`, `explorerContractUrl`
- `useVault` — extended with `streak: number` (was boolean `streakActive`)
- `useSCredit` — extended with `trustScore` and `lockedSavings` from chain
- Integration tests: `tests/integration.test.ts`, `tests/rosca-lifecycle.test.ts`, `tests/arbitration-lifecycle.test.ts`
- JSDoc `@module` comments on all `lib/` files and custom hooks
- `docs/architecture.md` — full architecture overview with contract dependency graph
- `CONTRIBUTING.md` — dev workflow, contract conventions, commit guidelines
- `SECURITY.md` — vulnerability reporting policy and secure coding guidelines
- README feature table, quick start guide, and documentation links

### Changed
- `VaultPanel` — refactored to use `useVault` hook, removes duplicate fetch logic
- `SCreditPanel` — fully refactored to use `useSCredit` hook with correct `useFormField` bindings
- `TrustScoreCard` — refactored to use `useTrustScore` hook
- `ThemeToggle` — integrated into `Navbar` (replaces static placeholder)
- `ToastContainer` — uses `explorerTxUrl()` instead of inline hardcoded URL
- `TxHistory`, `BadgeGallery`, `MemberProfile` — use `explorerTxUrl` / `explorerAddressUrl`
- All 12 panels — `aria-labelledby` on `<section>`, `id` on `<h2>`
- `Navbar` — `role="navigation"`, `aria-label="Main navigation"`
- `SkeletonCard` / `SkeletonRow` — `role="status"`, `aria-busy="true"`, `aria-label`
- All 9 data panels — `useToast()` replaces inline alert divs
- All 10 panels — `useWindowFocus(refresh)` for focus-triggered data invalidation
- `GovernancePanel`, `TaskBoard`, `CircleList` — `useMemo` for computed sub-lists
- `Dashboard` — `useCallback` for data fetch
- `TxHistory` — `useMemo` for filtered transaction list

### Security
- All secret files gitignored (`.env`, `*.pem`, `*.key`, mnemonics)
- `SECURITY.md` added with vulnerability disclosure process

---

## [0.1.0] — Initial scaffold

### Added
- 12 Clarity 2 contracts: `protocol-config`, `cooperative-registry`, `savings-vault`, `trust-score`, `lending-pool`, `labor-market`, `treasury`, `governance`, `rosca`, `reputation-nft`, `arbitration`, `synthetic-credit`
- React 18 + TypeScript + Vite frontend in `frontend/`
- `@stacks/connect` and `@stacks/transactions` integration
- `WalletContext`, `ToastContext`
- Custom hooks: `useVault`, `useLoan`, `useRosca`, `useTask`, `useTrustScore`, `useSCredit`, `useCircle`, `useFormField`, `useWindowFocus`
- Components: `Dashboard`, `CircleList`, `VaultPanel`, `LoanPanel`, `RoscaPanel`, `TaskBoard`, `TreasuryPanel`, `GovernancePanel`, `ArbitrationPanel`, `SCreditPanel`, `MemberProfile`, `BadgeGallery`, `TxHistory`, `TrustScoreCard`, `Navbar`, `ErrorBoundary`, `SkeletonCard`, `FormInput`, `ToastContainer`
- Clarinet test files for all 12 contracts
- GitHub Actions CI workflow
- `scripts/deploy-testnet.sh`, `scripts/deploy-mainnet.sh`
- `Makefile` with `check`, `test`, `deploy-testnet`, `deploy-mainnet` targets
- `settings/Devnet.toml`
- `frontend/.env.example`
