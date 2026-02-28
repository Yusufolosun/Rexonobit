# AmountInput

**Location:** `frontend/src/components/AmountInput.tsx`

A specialized numeric input for entering STX amounts. Always renders the display value in human-readable **STX** but stores and calls back in **uSTX** (microSTX, the on-chain denomination).

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `valueUstx` | `number` | *(required)* | Current value in uSTX |
| `onChangeUstx` | `(uSTX: number) => void` | *(required)* | Called with uSTX on change |
| `label` | `string` | `"Amount (STX)"` | Input label |
| `minStx` | `number` | `0` | Minimum STX value |
| `maxStx` | `number` | `undefined` | Maximum STX value |
| `disabled` | `boolean` | `false` | Disable the input |
| `hint` | `string` | `undefined` | Helper text below input |
| `error` | `string` | `undefined` | Validation error (shown in red, sets `aria-invalid`) |
| `className` | `string` | `""` | Extra CSS on the form group |

---

## Usage

```tsx
import AmountInput from "@/components/AmountInput";
import { useState } from "react";

function DepositForm() {
  const [uSTX, setUstx] = useState(0);

  return (
    <AmountInput
      label="Deposit amount"
      valueUstx={uSTX}
      onChangeUstx={setUstx}
      minStx={0.5}
      hint="Minimum: 0.5 STX"
      error={uSTX === 0 ? "Amount is required" : undefined}
    />
  );
}
```

---

## STX ↔ uSTX Conversion

| User types | `valueUstx` (callback value) |
|-----------|-------------------------------|
| `1` | `1_000_000` |
| `0.5` | `500_000` |
| `10` | `10_000_000` |

The conversion uses `Math.floor(stx × 1_000_000)` to avoid floating-point drift.

---

## Accessibility

- `<label>` is associated with the input via `htmlFor` using `useId()`.
- `aria-invalid="true"` is set when `error` prop is provided.
- Error message has `role="alert"` for immediate screen reader announcement.
- Hint and error text are linked via `aria-describedby`.

---

## CSS Dependencies

Uses classes from `frontend/src/index.css`:
- `.form-group`
- `.form-label`
- `.form-input`
- `.form-hint`
- `.form-error`

---

## Dependencies

- React 18 (`useId`)
- No external packages
