# useKeyboardShortcut

**Location:** `frontend/src/hooks/useKeyboardShortcut.ts`

Registers a global `document` keyboard shortcut that fires a callback when the specified key (plus optional modifier keys) is pressed. Cleans up the listener automatically on unmount or when dependencies change.

---

## Signature

```ts
function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options?: KeyboardShortcutOptions
): void
```

---

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ctrl` | `boolean` | `false` | Require Ctrl key |
| `shift` | `boolean` | `false` | Require Shift key |
| `alt` | `boolean` | `false` | Require Alt/Option key |
| `meta` | `boolean` | `false` | Require Meta/Cmd key |
| `keydown` | `boolean` | `true` | Listen on keydown (false = keyup) |
| `preventDefault` | `boolean` | `true` | Call `event.preventDefault()` |
| `stopPropagation` | `boolean` | `false` | Call `event.stopPropagation()` |
| `disabled` | `boolean` | `false` | Disable the listener |

---

## Usage

```tsx
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

// Ctrl+K — open search
useKeyboardShortcut("k", () => setSearchOpen(true), { ctrl: true });

// Escape — close modal (only when modal is visible)
useKeyboardShortcut("Escape", onClose, { disabled: !isOpen });

// Shift+? — open keyboard help overlay
useKeyboardShortcut("?", openHelp, { shift: true });

// / — focus search bar
useKeyboardShortcut("/", () => searchRef.current?.focus());
```

---

## Modifier Matching

When a modifier flag is `false` (the default), the hook ensures that modifier is **not** pressed. This prevents accidental firing when the user types `Ctrl+K` and your shortcut listens on plain `"k"`.

---

## Notes

- Key values follow the `KeyboardEvent.key` spec (case-insensitive matching applied internally).
- The callback ref is kept stable — changing `callback` does not re-register the listener.
- Does not fire when focus is inside an `<input>`, `<textarea>`, or `[contenteditable]` unless the consuming component explicitly handles that.
