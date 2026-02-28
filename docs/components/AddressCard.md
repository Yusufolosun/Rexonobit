# AddressCard

`src/components/AddressCard.tsx`

Renders a Stacks principal address inside a compact chip with a one-click copy-to-clipboard button.  Uses `truncateAddress` from `lib/format` and `useCopyToClipboard`.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `address` | `string` | — | Full Stacks address (ST… / SP…) |
| `label` | `string` | — | Optional label rendered above the chip |
| `startChars` | `number` | `6` | Visible leading characters |
| `endChars` | `number` | `4` | Visible trailing characters |
| `showTitle` | `boolean` | `true` | Exposes full address via `title` attribute on hover |
| `className` | `string` | `""` | Extra class names for the wrapper |

---

## Usage

```tsx
import { AddressCard } from "../components/AddressCard";

// Minimal
<AddressCard address={senderAddress} />

// With label
<AddressCard address={recipientAddress} label="Recipient" />

// Custom truncation
<AddressCard address={address} startChars={8} endChars={6} />
```

---

## Accessibility

- Copy button has `aria-label="Copy address ST1PQ…GM"` before copy and `aria-label="Address copied"` (with checkmark) after.
- The checkmark / copy SVG icons carry `aria-hidden="true"` so screen readers only read the button label.
- The full address is available via `title` attribute (dismissible with `showTitle={false}`).

---

## Integration Example

```tsx
// In MemberProfile, showing the wallet address
<AddressCard address={stxAddress} label="Wallet" startChars={8} endChars={6} />
```
