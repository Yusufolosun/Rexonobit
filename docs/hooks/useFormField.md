# useFormField

**File:** `frontend/src/hooks/useFormField.ts`

## Purpose

Lightweight controlled input state hook with inline validation. Manages the value, touched state, and error message for a single form field. Designed to work with validators from `lib/validators.ts`.

## Signature

```ts
function useFormField(
  initialValue: string,
  validate?: (value: string) => string | null
): FormFieldState
```

## Parameters

| Param | Type | Description |
|-------|------|-------------|
| `initialValue` | `string` | Initial field value |
| `validate` | `(v: string) => string \| null` | Validator function returning error string or null |

## Return Value

| Field | Type | Description |
|-------|------|-------------|
| `value` | `string` | Current field value |
| `error` | `string \| null` | Current validation error, or null |
| `touched` | `boolean` | True after the field has been interacted with |
| `onChange` | `(v: string) => void` | Handler to update value and run validation |
| `onBlur` | `() => void` | Handler to mark the field as touched |
| `reset` | `() => void` | Reset value, error, and touched to initial state |
| `validate` | `() => boolean` | Imperatively run validation; returns true if valid |

## Example

```tsx
const amountField = useFormField("", validateSTX);

<FormInput
  label="Amount (STX)"
  value={amountField.value}
  onChange={amountField.onChange}
  onBlur={amountField.onBlur}
  error={amountField.error}
/>
```

## Notes

- Error is only shown after first interaction (`touched`) or after calling `validate()`.
- Compose multiple `useFormField` calls for multi-field forms.
