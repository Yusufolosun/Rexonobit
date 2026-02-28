# NetworkBadge

**Location:** `frontend/src/components/NetworkBadge.tsx`

Displays the active Stacks network as a colour-coded pill badge with a status dot and label.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `network` | `"mainnet" \| "testnet" \| "devnet" \| "mocknet"` | *(required)* | Active Stacks network |
| `showLabel` | `boolean` | `true` | Show the text label beside the dot |
| `className` | `string` | `""` | Extra CSS class |

---

## Colour Mapping

| Network | Background | Text | Dot |
|---------|-----------|------|-----|
| `mainnet` | Green tint | `#16a34a` | `#22c55e` |
| `testnet` | Orange tint | `#c2410c` | `#f97316` |
| `devnet` | Purple tint | `#7c3aed` | `#8b5cf6` |
| `mocknet` | Grey tint | `#64748b` | `#94a3b8` |

---

## Usage

```tsx
import NetworkBadge from "@/components/NetworkBadge";
import { useWallet } from "@/context/WalletContext";

function Header() {
  const { network } = useWallet();
  return (
    <header>
      <span>Rexonobit</span>
      <NetworkBadge network={network} />
    </header>
  );
}

// Icon-only mode
<NetworkBadge network="testnet" showLabel={false} />
```

---

## Environment-Driven Usage

```tsx
const network = import.meta.env.VITE_STACKS_NETWORK as NetworkMode ?? "testnet";
<NetworkBadge network={network} />
```

---

## Accessibility

- `aria-label` on the wrapper conveys the active network to assistive technology.
- The status dot is `aria-hidden`.
