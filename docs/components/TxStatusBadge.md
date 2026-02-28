# TxStatusBadge

**Location:** `frontend/src/components/TxStatusBadge.tsx`

Displays the status of a Stacks transaction as a colour-coded pill badge. Accepts the raw `tx_status` string from the Stacks API.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `TxStatus \| string` | *(required)* | Transaction status from Stacks API |
| `animated` | `boolean` | `false` | Show pulsing dot for pending state |
| `className` | `string` | `""` | Extra CSS class |

---

## Status Values

| `tx_status` | Label | Colour |
|-------------|-------|--------|
| `pending` | Pending | Orange |
| `success` | Confirmed | Green |
| `abort_by_response` | Aborted | Red |
| `abort_by_post_condition` | Post-cond fail | Red |
| `dropped` | Dropped | Grey |
| `not_found` | Not found | Grey |
| *(other)* | Unknown | Grey |

---

## Usage

```tsx
import TxStatusBadge from "@/components/TxStatusBadge";

// With animated pending state
<TxStatusBadge status={tx.tx_status} animated />

// Static
<TxStatusBadge status="success" />

// With useContractCall
const { status, txId } = useContractCall();
{txId && <TxStatusBadge status={status === "success" ? "success" : "pending"} animated />}
```

---

## Notes

- Unknown status strings render as "Unknown" with a grey badge.
- The `aria-label` attribute provides status text for screen readers.
