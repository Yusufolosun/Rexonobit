# format

**File:** `frontend/src/lib/format.ts`

## Purpose

Pure formatting helpers for displaying STX amounts, Stacks addresses, percentages, counts, block heights, and timestamps. All functions are stateless and side-effect-free. Use these instead of inline `toFixed` / `toLocaleString` calls.

## Exports

### `formatMicroSTX(microSTX: number, decimals?: number): string`

Converts microSTX to a readable STX string.

```ts
formatMicroSTX(5_500_000)    // "5.50 STX"
formatMicroSTX(1_000_000, 0) // "1 STX"
```

### `formatMicroSTXCompact(microSTX: number): string`

Compact form with K/M suffix for dashboard cards.

```ts
formatMicroSTXCompact(5_500_000_000) // "5.5K STX"
formatMicroSTXCompact(2_000_000_000_000) // "2.00M STX"
```

### `truncateAddress(address: string, startChars?: number, endChars?: number): string`

Shortens a Stacks principal for display.

```ts
truncateAddress("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM") // "ST1PQH...PGZGM"
```

### `formatBlockHeight(height: number): string`

```ts
formatBlockHeight(123456) // "Block #123,456"
```

### `formatTimestamp(unixSeconds: number): string`

```ts
formatTimestamp(1700000000) // "Nov 14, 2023"
```

### `formatPercent(value: number, decimals?: number): string`

```ts
formatPercent(67.5) // "67.5%"
```

### `formatCount(value: number): string`

```ts
formatCount(12345) // "12,345"
```

## Usage

```ts
import { formatMicroSTX, truncateAddress } from '../lib/format';

<span>{formatMicroSTX(vault.balance)}</span>
<span>{truncateAddress(userAddress)}</span>
```

## Notes

- Uses `"en-US"` locale for consistent number formatting.
- All functions return strings; never return `null` or throw.
