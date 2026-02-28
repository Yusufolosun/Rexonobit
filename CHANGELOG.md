# Changelog

All notable changes to REXONOBIT are documented here.

This project follows [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

---

## [0.7.0] — 2024-07-15

### Added — Frontend Hooks
- `useNetworkStatus` — online/offline detection with Network Information API
- `useKeyboardShortcut` — global keyboard shortcut with modifier key support
- `useHover` — hover state tracker via DOM ref
- `useIntersectionObserver` — viewport intersection with freeze-on-visible
- `useDarkMode` — dark/light scheme toggle with localStorage persistence
- `useContractCall` — `@stacks/connect` contract call with status/txId/error state

### Added — UI Components
- `ConfirmModal` — accessible confirmation dialog with Escape/overlay dismiss
- `NetworkBadge` — mainnet/testnet/devnet/mocknet colour-coded pill
- `AlertBanner` — dismissible info/success/warning/error inline alert
- `TxStatusBadge` — Stacks `tx_status` colour-coded badge
- `ConnectionStatus` — offline detection banner

### Added — Library Modules
- `lib/api.ts` — typed Stacks Blockchain API helpers (account, block, tx, read-only, broadcast)
- `lib/errors.ts` — typed error classes, contract error parser, `getUserMessage()`

### Added — Architecture Docs
- `docs/architecture/savings-vault-mechanics.md`
- `docs/architecture/protocol-config-reference.md`
- `docs/architecture/reputation-nft-mechanics.md`

### Added — Integration Tests
- `tests/rosca-integration.test.ts` — 6 integration scenarios
- `tests/lending-pool-lifecycle.test.ts` — 6 lifecycle scenarios
- `tests/trust-score-lifecycle.test.ts` — 6 lifecycle scenarios
- `tests/synthetic-credit-lifecycle.test.ts` — 5 lifecycle scenarios
- `tests/treasury-lifecycle.test.ts` — 6 lifecycle scenarios

### Added — CSS Utilities
- Spacing utilities: `.m-*`, `.mt-*`, `.mb-*`, `.p-*`, `.px-*`, `.py-*`, `.mx-auto`
- Shadow utilities: `.shadow-none` through `.shadow-xl`, `.shadow-inner`

### Added — Build Tooling
- Makefile `format` target — runs Prettier on `frontend/src`
- Makefile `check-deps` target — runs `npm audit` in `frontend/`

---

## [0.6.0] — 2024-07-01

### Added
- `frontend/src/hooks/useFetch.ts` — generic data-fetch hook with `loading`, `error`, `data`, `refetch()`, and `AbortController` cleanup on unmount
- `frontend/src/hooks/useError.ts` — error state manager with `setError`, `clearError`, and `wrapAsync` helpers
- `frontend/src/hooks/useAsyncCallback.ts` — wraps arbitrary async functions with `loading`/`error` tracking, safe on unmounted components
- `frontend/src/lib/sort.ts` — non-mutating sort utilities (trust score, date, block height, circle balance/name/member count, loan due date/amount)
- `frontend/src/lib/parseError.ts` — full error code registry for all 12 contracts; `parseContractError`, `extractErrorCode`, `isOk`, `isErr`
- `frontend/src/lib/datetime.ts` — `blocksToHuman`, `blockHeightToEta`, `blocksUntil`, `isPast`, `timeAgo`, `unixTimeAgo`, `formatDate`
- `frontend/src/context/NotificationsContext.tsx` — `NotificationsProvider` with `addNotification`, `dismiss`, `markAllRead`, `unreadCount`
- `frontend/src/context/WalletContext.tsx` — added `NetworkMode`, `network` state initialized from Vite env define, `setNetwork` action
- `tests/labor-market-integration.test.ts` — 5 end-to-end integration tests covering task post/bid/accept/complete/attest/dispute flows
- `tests/lending-pool-integration.test.ts` — 6 integration tests for fund/request/repay/liquidate/over-budget scenarios

### Improved
- **A11y** — `CircleCard`, `MemberProfile`, `BadgeGallery` now use `role`, `aria-label`, `aria-busy`
- **CSS** — card hover lift (`translateY(-2px)` + shadow), tooltip wrapper, badge/tag classes (`.badge-primary`, `.badge-success`, etc.)
- **Makefile** — added `test-integration`, `ci`, `size-check` targets

### Docs
- Hook docs: `useWindowSize`, `useClickOutside`, `useKeyPress`, `useCountdown`, `useSet`, `useMap`, `useQueue`, `useFetch`, `useError`, `useAsyncCallback`
- Lib docs: `sort.md`, `parseError.md`, `datetime.md`
- Architecture docs: `trust-score-algorithm.md`, `loan-mechanics.md`, `rosca-mechanics.md`, `governance-flow.md`
- Component docs: all 24 components now documented in `docs/components/`
- README error codes section covering all 12 contracts

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

## [0.2.0] — CI workflows and test expansion

### Added
- `.github/workflows/typecheck.yml` — dedicated TypeScript type-check on all `src/` changes
- `.github/workflows/security-audit.yml` — `npm audit` + Gitleaks secret scan
- `.github/workflows/codeql.yml` — CodeQL static analysis (JS/TS) on push and weekly schedule
- `.github/workflows/stale.yml` — auto-label stale issues/PRs; close if no activity after 7 days
- `.github/workflows/release.yml` — on tag push: type-check → build → zip → create GitHub Release
- Edge-case test suites appended to all 14 Clarinet test files (3–5 tests per file)
- `Makefile` targets: `format`, `preview`, `audit`, `clean-all`

### Changed
- Existing CI workflow extended with `frontend/` job matrix

---

## [0.3.0] — Utility hooks and lib utilities

### Added
- `lib/format.ts` — `formatMicroSTX`, `formatMicroSTXCompact`, `truncateAddress`, `formatBlockHeight`, `formatTimestamp`, `formatPercent`, `formatCount`
- `lib/math.ts` — `toMicroSTX`, `fromMicroSTX`, `calcSimpleInterest`, `calcRepaymentTotal`, `calcUtilization`, `calcTrustContribution`, `sum`, `clamp`
- `useDebounce` hook — delays state update by a configurable quiet period
- `useCopyToClipboard` hook — clipboard write with transient `copied` state
- `useMediaQuery` hook — reactive CSS `matchMedia` listener
- `useLocalStorage` hook — JSON-serialised `localStorage` state
- `useToggle` hook — boolean with `toggle`, `setTrue`, `setFalse` methods
- `usePrevious` hook — returns the previous render value via a ref
- `usePagination` hook — client-side array pagination with page controls
- `useInterval` hook — declarative `setInterval` with null-pause support
- Reference docs under `docs/hooks/` for all 8 new hooks
- Reference docs under `docs/lib/` for `format.md` and `math.md`

---

## [0.4.0] — TypeScript strictness and accessibility audit

### Changed
- `frontend/tsconfig.app.json` — added `"noImplicitOverride": true`
- `frontend/tsconfig.node.json` — added `"noImplicitOverride": true`
- `TrustScoreCard` — `ScoreBar` now exposes `role="progressbar"`, `aria-valuenow/min/max`, `aria-label`; tier badge receives `aria-label`
- `VaultPanel` — deposit, withdraw, and withdraw-locked buttons get `aria-busy={txPending}` and `aria-label`
- `LoanPanel` — all four action buttons get `aria-busy` and `aria-label`
- `GovernancePanel` — all five action buttons get `aria-busy` and `aria-label`
- `TreasuryPanel` — deposit, propose, vote YES/NO, execute buttons get `aria-busy` and `aria-label`
- `RoscaPanel` — create, join, lock, contribute, payout, set-order buttons get `aria-busy` and `aria-label`
- `TaskBoard` — all seven task action buttons get `aria-busy` and `aria-label`
- `ArbitrationPanel` — open, join panel, close, submit-verdict buttons get `aria-busy` and `aria-label`
- `SCreditPanel` — mint, burn, transfer buttons get `aria-busy` and `aria-label`

---

## [0.5.0] — UI component library expansion

### Added
- `ProgressBar` component — accessible progress bar with `role="progressbar"` and full ARIA attribute set
- `AddressCard` component — Stacks address chip with copy-to-clipboard using `useCopyToClipboard`
- `StatCard` component — metric tile with skeleton loading state and accent colour stripe
- `NotificationBell` component — bell icon with unread-count badge and accessible dropdown
- Reference docs for all four new components under `docs/components/`

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
