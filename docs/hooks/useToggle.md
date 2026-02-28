# useToggle

**File:** `frontend/src/hooks/useToggle.ts`

## Purpose

Boolean state with convenient `toggle`, `setTrue`, and `setFalse` helpers. Replaces repeated `useState(false)` + `() => setState(v => !v)` patterns throughout modal, dropdown, and accordion components.

## Signature

```ts
function useToggle(initialValue?: boolean): [boolean, () => void, () => void, () => void]
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `initialValue` | `boolean` | `false` | Initial open/closed state |

## Returns

| Index | Name | Description |
|-------|------|-------------|
| `[0]` | `value` | Current boolean state |
| `[1]` | `toggle` | Flip the value |
| `[2]` | `setTrue` | Force `true` |
| `[3]` | `setFalse` | Force `false` |

## Example

```tsx
const [isOpen, toggleOpen, openModal, closeModal] = useToggle();
return (
  <>
    <button onClick={openModal}>Open</button>
    {isOpen && <Modal onClose={closeModal} />}
  </>
);
```

## Notes

- All three action callbacks are stable references (`useCallback`) — safe as effect dependencies.
