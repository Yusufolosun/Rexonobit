# validators

**File:** `frontend/src/lib/validators.ts`

## Purpose

Pure validation utilities used by `useFormField` and `FormInput`. Every function is side-effect-free and returns a `ValidationResult`. Callers check `.valid` and display `.error` when the field is invalid.

## `ValidationResult` Interface

```ts
interface ValidationResult {
  valid: boolean;
  error: string | null;
}
```

## Exported Functions

### `validateSTX(value: string, label?: string): ValidationResult`

Validates an STX amount string.

- Must be a number greater than `0`.
- Minimum: `0.000001` STX.
- Maximum: `1,000,000` STX.

### `validatePositiveInt(value: string, label?: string): ValidationResult`

Validates a positive whole number (circle IDs, task IDs, group IDs, etc.).

- Must be an integer `> 0`.
- No fractional values accepted.

### `validateRequired(value: string, label?: string): ValidationResult`

Validates that a string field is non-empty after trimming.

### `validateMaxLength(value: string, max: number, label?: string): ValidationResult`

Validates a required string with a maximum character length.

### `validatePrincipal(value: string): ValidationResult`

Validates a Stacks principal address.

- Must start with `SP` or `ST`.
- Must be 40–42 characters.

### `validatePercentage(value: string, label?: string): ValidationResult`

Validates a percentage value (0–100, supports decimals).

## Usage

```ts
import { validateSTX, validateRequired } from '../lib/validators';

const amountResult = validateSTX(amountField.value, 'Deposit amount');
if (!amountResult.valid) return amountResult.error; // "Deposit amount must be greater than zero."
```

## Notes

- Validators are imported by `useFormField` — do not duplicate validation logic in components.
- All label parameters default to a sensible generic string if omitted.
