# BlockCountdown

**Location:** `frontend/src/components/BlockCountdown.tsx`

Renders a human-readable countdown to a future Stacks block height. Optionally shows the estimated wall-clock ETA date alongside the blocks-remaining string.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentBlock` | `number` | *(required)* | Current chain tip block height |
| `targetBlock` | `number` | *(required)* | Target block height to count down to |
| `label` | `string` | `"Expires in"` | Prefix label |
| `expiredLabel` | `string` | `"Expired"` | Text shown when target block is past |
| `showDate` | `boolean` | `false` | Display estimated wall-clock date next to duration |
| `className` | `string` | `""` | Extra CSS class names |

---

## Usage

```tsx
import BlockCountdown from "@/components/BlockCountdown";

// Loan due countdown
<BlockCountdown
  currentBlock={chainTip}
  targetBlock={loan.dueBlock}
  label="Loan due"
  showDate
/>

// Circle payout countdown
<BlockCountdown
  currentBlock={chainTip}
  targetBlock={circle.nextPayoutBlock}
  label="Next payout"
/>

// Vault unlock
<BlockCountdown
  currentBlock={chainTip}
  targetBlock={vault.unlockBlock}
  label="Unlocks"
  expiredLabel="Available to withdraw"
  showDate
/>
```

---

## Output Examples

| Remaining blocks | Output (label = "Expires in") |
|-----------------|-------------------------------|
| 6 | `Expires in: ~1 hour` |
| 144 | `Expires in: ~24 hours` |
| 0 | `Expired` (red, bold) |

With `showDate=true`:
```
Expires in: ~3 days  (Jun 15, 2025)
```

---

## Accessibility

- The outer `<span>` has `aria-label` set to the human-readable countdown string.
- A `title` attribute with block numbers (`"Block 150000 (current: 149856)"`) is included for advanced users.

---

## Dependencies

- `lib/datetime` — `blocksToHuman`, `blockHeightToEta`, `blocksUntil`, `isPast`
- React 18
