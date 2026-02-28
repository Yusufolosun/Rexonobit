# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` branch | ✅ |
| Tagged releases | ✅ |
| Feature branches | ❌ (no security support) |

---

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Please report security issues by emailing the maintainers directly. Include:

1. A clear description of the vulnerability
2. Steps to reproduce (proof of concept if possible)
3. Potential impact assessment
4. Any suggested mitigations

You will receive an acknowledgement within 48 hours and a resolution timeline within 7 days.

---

## Security Guidelines for Contributors

### Private Keys and Secrets

- **Never** commit private keys, mnemonics, or seed phrases
- **Never** commit `.env` files — use `.env.example` as a template
- All secret values must go in environment variables, never hardcoded
- The following patterns are blocked by `.gitignore`:

```
.env
.env.local
.env.*.local
*.pem
*.key
*secret*
*mnemonic*
```

### Clarity Contract Security

- Call `initialize` on `protocol-config` with a deployer-only guard — never leave it callable by anyone
- All admin functions must check `(is-eq tx-sender (var-get contract-owner))`
- Use checked arithmetic — Clarity 2 has overflow protection by default
- Never expose a function that can drain the contract treasury without multi-sig or timelock
- Validate all principal inputs before using them in `stx-transfer?` or `ft-transfer?`
- Prefer `(try! ...)` over unwrap calls to propagate errors properly

### Frontend Security

- Never expose API keys or Stacks private keys in the browser bundle
- Use environment variables prefixed with `VITE_` for public config only (network URLs, contract addresses)
- Validate all user inputs with `frontend/src/lib/validators.ts` before submitting transactions
- Do not `eval()` or use `dangerouslySetInnerHTML` with unescaped user data
- All Stacks transactions go through `@stacks/connect` — never sign manually in the frontend

### Dependencies

- Run `npm audit` before releasing
- Pin minor versions for Stacks packages to avoid unexpected breaking changes
- Review Clarinet release notes before upgrading the test runner

---

## Known Security Assumptions

1. **Stacks network trust**: The protocol trusts the underlying Stacks blockchain for finality and ordering
2. **Wallet trust**: Users are responsible for the security of their Stacks wallet private keys
3. **Off-chain API**: Transaction history fetched from Hiro API is informational only — on-chain state is authoritative
4. **Testnet vs. Mainnet**: The `VITE_NETWORK` environment variable must be set correctly before deploying; mixing testnet contracts with mainnet wallets will result in failed transactions

---

## Disclosure Timeline

| Day | Action |
|-----|--------|
| 0 | Vulnerability reported |
| 1–2 | Acknowledgement sent |
| 3–7 | Root cause analysis |
| 7–14 | Fix developed and reviewed |
| 14–21 | Patched release deployed |
| 21+ | Public disclosure (coordinated) |
