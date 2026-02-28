# datetime

**Location:** `frontend/src/lib/datetime.ts`

Utilities for converting between Stacks block heights and human-readable time strings, and for formatting ISO-8601 timestamps.

---

## Constants

| Name | Value | Description |
|------|-------|-------------|
| `BLOCK_TIME_SECONDS` | `600` | Average Stacks mainnet block time in seconds |
| `BLOCK_TIME_MINUTES` | `10` | Average Stacks mainnet block time in minutes |

---

## Functions

### `blocksToHuman(blocks: number): string`

Converts a number of blocks to a readable duration string.

| Input | Output |
|-------|--------|
| `6` | `"~1 hour"` |
| `144` | `"~24 hours"` |
| `1008` | `"~7 days"` |

```ts
import { blocksToHuman } from "@/lib/datetime";

blocksToHuman(144);  // "~24 hours"
blocksToHuman(1440); // "~10 days"
```

---

### `blockHeightToEta(targetBlock, currentBlock): Date`

Returns the estimated wall-clock `Date` when a future block will be mined.

```ts
const eta = blockHeightToEta(100_500, 100_000); // ~3.5 days from now
```

---

### `blocksUntil(targetBlock, currentBlock): number`

Returns the number of blocks remaining until a target. Returns `0` if the target is already past.

---

### `isPast(targetBlock, currentBlock): boolean`

Returns `true` if `currentBlock >= targetBlock`.

---

### `timeAgo(isoTimestamp: string): string`

Returns a fuzzy relative time string from an ISO-8601 timestamp.

```ts
timeAgo("2024-06-01T12:00:00Z"); // "3d ago"
```

Resolution levels: `s`, `m`, `h`, `d`, `w`, `mo`.

---

### `unixTimeAgo(unixSeconds: number): string`

Same as `timeAgo` but accepts a Unix timestamp in seconds (common in Stacks API responses).

```ts
unixTimeAgo(tx.burnBlockTime); // "2h ago"
```

---

### `formatDate(isoTimestamp: string): string`

Returns a locale date string (`"Jun 1, 2024"` style). Returns `"—"` for invalid input.

---

## Usage Patterns

```ts
// Loan due-block countdown
<span>{blocksToHuman(loan.dueBlock - currentBlock)} remaining</span>

// ROSCA next payout ETA
const eta = blockHeightToEta(circle.nextPayoutBlock, chainTip);
<span>Next payout: {formatDate(eta.toISOString())}</span>

// Transaction timestamp
<td>{unixTimeAgo(tx.burnBlockTime)}</td>
```

---

## Notes

- These are **estimates** — actual block times vary.
- Block times on **testnet/devnet** can differ significantly from 10 min. Conditionally use shorter constants during development.
- No external dependencies.
