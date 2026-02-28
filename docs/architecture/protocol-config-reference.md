# Protocol Config — Reference

**Contract:** `contracts/protocol-config.clar`

Central configuration registry for all protocol-wide parameters. Only the protocol admin (deployer) can update values. All writes are validated against min/max bounds stored in the contract.

---

## Overview

`protocol-config` acts as a single source of truth for numeric and flag parameters used by every other contract. Contracts call `get-param` to read values rather than hard-coding constants, making protocol upgrades possible without redeployment.

---

## Config Keys

### Fee Parameters

| Key | Default (bps) | Range | Description |
|-----|--------------|-------|-------------|
| `loan-origination-fee` | 50 | 0–500 | Fee charged to borrowers on loan creation (basis points) |
| `early-withdrawal-penalty` | 100 | 0–1000 | Penalty for savings vault early exit (bps) |
| `platform-fee` | 25 | 0–200 | Platform fee on ROSCA disbursements (bps) |
| `arbitration-fee` | 200 | 50–500 | Fee to open an arbitration case (bps) |

### Duration / Block Parameters

| Key | Default (blocks) | Range | Description |
|-----|-----------------|-------|-------------|
| `min-loan-duration` | 144 | 10–52560 | Shortest allowed loan term |
| `max-loan-duration` | 52560 | 144–525600 | Longest allowed loan term |
| `voting-period` | 1440 | 144–10080 | Governance proposal voting window |
| `execution-delay` | 144 | 0–1440 | Blocks between vote end and execution |
| `rosca-interval-min` | 144 | 10–10080 | Minimum ROSCA round interval |
| `streak-window` | 1440 | 144–10080 | Max gap between deposits for streak continuity |
| `savings-lock-short` | 144 | 10–1008 | Short lock-period preset |
| `savings-lock-medium` | 1008 | 144–4320 | Medium lock-period preset |
| `savings-lock-long` | 4320 | 1008–52560 | Long lock-period preset |

### Limit Parameters

| Key | Default (uSTX) | Range | Description |
|-----|---------------|-------|-------------|
| `min-deposit` | 500000 | 1–10000000 | Minimum vault deposit (0.5 STX) |
| `max-loan-amount` | 500000000 | 100000–u128max | Maximum single loan |
| `min-loan-amount` | 1000000 | 1–10000000 | Minimum single loan amount (1 STX) |
| `min-contribution` | 100000 | 1–1000000 | Minimum ROSCA contribution |
| `credit-unit` | 1000000 | 100000–10000000 | Synthetic credit line unit size (1 STX) |

### Ratio Parameters

| Key | Default (bps) | Range | Description |
|-----|--------------|-------|-------------|
| `collateral-ratio` | 15000 | 10000–30000 | Required collateral ratio (150%) |
| `reserve-ratio` | 2000 | 500–5000 | Treasury reserve ratio (20%) |
| `max-loan-to-value` | 8000 | 5000–9500 | Max loan-to-value ratio (80%) |
| `quorum-threshold` | 5100 | 3000–9000 | Governance quorum (51%) |

---

## Admin Functions

### `set-param(key, value)`

Updates a configuration value. Reverts with `ERR_OUT_OF_RANGE` if the value is outside allowed bounds.

```clarity
(contract-call? .protocol-config set-param "loan-origination-fee" u75)
```

### `get-param(key)`

Returns the current value for a config key.

```clarity
(contract-call? .protocol-config get-param "min-deposit")
;; => (ok u500000)
```

---

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| 800 | `ERR_UNAUTHORIZED` | Caller is not the admin |
| 801 | `ERR_UNKNOWN_KEY` | Config key does not exist |
| 802 | `ERR_OUT_OF_RANGE` | Value is below min or above max |
| 803 | `ERR_ZERO_VALUE` | Value must be greater than zero |

---

## Security Notes

- Config updates are gated by `(is-eq tx-sender contract-owner)`.
- Basis-point values use `u10000 = 100%` throughout.
- Changing fee parameters takes effect at the **next** transaction; in-flight loans use the fee captured at origination.
