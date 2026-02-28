# useCopyToClipboard

**File:** `frontend/src/hooks/useCopyToClipboard.ts`

## Purpose

Clipboard write hook. Provides a `copyToClipboard` action and a transient `copied` boolean that resets automatically. Use for "Copy address" buttons in `MemberProfile` and `TxHistory`.

## Signature

```ts
function useCopyToClipboard(resetMs?: number): CopyResult
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `resetMs` | `number` | `2000` | How long `copied` stays `true` (ms) |

## Returns (`CopyResult`)

| Field | Type | Description |
|-------|------|-------------|
| `copied` | `boolean` | `true` for `resetMs` ms after a successful copy |
| `copyError` | `string \| null` | Error message if copy failed |
| `copyToClipboard` | `(text: string) => Promise<void>` | Write `text` to clipboard |

## Example

```tsx
const { copied, copyToClipboard } = useCopyToClipboard();
return (
  <button onClick={() => copyToClipboard(address)}>
    {copied ? "Copied!" : "Copy address"}
  </button>
);
```

## Notes

- Uses `navigator.clipboard.writeText` when available.
- Falls back to `document.execCommand("copy")` for legacy browser support.
- `copyError` is reset to `null` on every new copy attempt.
