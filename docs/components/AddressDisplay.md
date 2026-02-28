# AddressDisplay

**Location:** `frontend/src/components/AddressDisplay.tsx`

Renders a truncated Stacks principal address (SP…, ST…, or SM…) with optional clipboard copy button and full-address tooltip.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `address` | `string` | *(required)* | Full Stacks principal address |
| `prefixLen` | `number` | `4` | Characters to show at the start |
| `suffixLen` | `number` | `5` | Characters to show at the end |
| `copyable` | `boolean` | `false` | Show a `CopyButton` to copy the full address |
| `tooltip` | `boolean` | `false` | Show the full address in a tooltip on hover |
| `mono` | `boolean` | `true` | Render address in monospace font |
| `className` | `string` | `""` | Extra class on the address `<span>` |

---

## Usage

```tsx
import AddressDisplay from "@/components/AddressDisplay";

// Basic truncated display
<AddressDisplay address="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM" />
// Output: ST1P…PGZGM

// Full featured
<AddressDisplay
  address={walletAddress}
  copyable
  tooltip
  prefixLen={6}
  suffixLen={6}
/>

// In a table cell
<td>
  <AddressDisplay address={member.address} copyable />
</td>
```

---

## Truncation Examples

| `prefixLen` | `suffixLen` | Address portion | Result |
|-------------|-------------|-----------------|--------|
| 4 | 5 | `ST1PQHQKV0…PGZGM` | `ST1P…PGZGM` |
| 6 | 6 | `ST1PQH…PGZGM1` | `ST1PQH…PGZGM1` |
| 8 | 4 | `ST1PQHQK…ZGZGM` | `ST1PQHQK…ZGZGM` |

---

## Dependencies

- `CopyButton` — clipboard copy with success feedback
- `TooltipWrapper` — hover tooltip for full address
- `lib/format.truncateAddress` — truncation logic
- React 18
