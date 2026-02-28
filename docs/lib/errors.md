# errors

**Location:** `frontend/src/lib/errors.ts`

Typed error classes, contract error code parsing, and a `getUserMessage()` utility that converts any thrown value into a safe, user-displayable string.

---

## Error Classes

### `RexonobitError`
Base class for all application errors. Has a `code` field (`number | string`).

### `ContractError`
Thrown when a Clarity contract returns an `(err uXXX)` value.
```ts
throw new ContractError(1202); // "Funds are still locked"
```

### `WalletError`
Thrown for wallet interaction failures (user cancellation, unavailable extension).

### `NetworkError`
Thrown for HTTP/fetch failures. Optional `status` property holds the HTTP status code.

### `ValidationError`
Thrown for client-side validation failures with an optional `field` name.

---

## Functions

### `parseContractError(clarityResult)`

Parses a Clarity result string like `"(err u1200)"` and returns a `ContractError`, or `null` if not an error response.

```ts
import { parseContractError } from "@/lib/errors";

const err = parseContractError(result.result);
if (err) console.error(getUserMessage(err));
```

---

### `getUserMessage(err)`

Returns a safe, human-readable string for any caught value. Never exposes stack traces or internal details.

```ts
import { getUserMessage } from "@/lib/errors";

try {
  await call(options);
} catch (err) {
  setErrorMsg(getUserMessage(err));
}
```

---

## Error Code Reference (subset)

| Code | Message |
|------|---------|
| 1202 | Funds are still locked |
| 1200 | You are not a registered member |
| 500 | Insufficient pool liquidity |
| 1104 | Recipient is not eligible (delinquent) |
| 303 | Quorum not reached |
| 401 | NFT is soulbound and cannot be transferred |

See full table in `errors.ts`.

---

## Security Note

`getUserMessage()` always returns a generic fallback for unexpected errors, preventing accidental disclosure of internal state or stack traces to end users.
