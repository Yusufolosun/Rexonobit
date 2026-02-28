# parseError

Converts raw Clarity `(err uXXX)` response strings or numeric error codes into user-facing messages for all REXONOBIT protocol contracts.

## Import

```ts
import { parseContractError, extractErrorCode, isOk, isErr } from "@/lib/parseError";
```

---

## Functions

### `parseContractError(input: string | number): string`

Returns a human-readable message for a Clarity error response.

| Input type | Behaviour |
| ---------- | --------- |
| `"(err u102)"` | Looks up code `102` → `"Not a registered member"` |
| `number` (e.g. `303`) | Looks up code directly |
| Unrecognized string | Returned as-is (pass-through for network errors) |
| Unknown code | Returns `"Contract error code {n}"` |

```ts
parseContractError("(err u102)");  // "Not a registered member"
parseContractError(303);           // "Loan not found"
parseContractError("timeout");     // "timeout"
```

---

### `extractErrorCode(clarityError: string): number | null`

Extracts the numeric code from a Clarity `(err uXXX)` string. Returns `null` for non-error strings.

```ts
extractErrorCode("(err u503)");  // 503
extractErrorCode("(ok true)");   // null
```

---

### `isOk(clarityResponse: string): boolean`

```ts
isOk("(ok true)");      // true
isOk("(err u102)");     // false
```

### `isErr(clarityResponse: string): boolean`

```ts
isErr("(err u102)");    // true
isErr("(ok u1)");       // false
```

---

## Error Code Reference

### cooperative-registry (1xx)

| Code | Message |
| ---- | ------- |
| 100 | Protocol not yet initialized |
| 101 | Already a registered member |
| 102 | Not a registered member |
| 103 | Circle not found |
| 104 | Circle is full |
| 105 | Already a circle member |
| 106 | Not a circle member |
| 107 | Unauthorized — circle lead only |

### savings-vault (2xx)

| Code | Message |
| ---- | ------- |
| 200 | Insufficient vault balance |
| 201 | Deposit amount too low |
| 203 | Vault is locked |
| 204 | Lock period not yet expired |

### lending-pool (3xx)

| Code | Message |
| ---- | ------- |
| 300 | Lending pool not found |
| 301 | Pool has insufficient liquidity |
| 302 | Loan amount exceeds pool limit |
| 303 | Loan not found |
| 304 | Loan is not active |
| 307 | Loan is not overdue — cannot liquidate |

### rosca (4xx)

| Code | Message |
| ---- | ------- |
| 400 | ROSCA not found |
| 401 | ROSCA already started |
| 403 | Already a ROSCA member |
| 404 | Not a ROSCA member |
| 406 | Contribution amount is incorrect |

### governance (5xx)

| Code | Message |
| ---- | ------- |
| 500 | Proposal not found |
| 501 | Voting period has ended |
| 502 | Voting period is still open |
| 503 | Already voted on this proposal |
| 506 | Insufficient voting power |

### treasury (6xx) · trust-score (7xx) · reputation-nft (8xx)

See [parseError.ts](../../frontend/src/lib/parseError.ts) for the full registry.

### labor-market (9xx)

| Code | Message |
| ---- | ------- |
| 900 | Task not found |
| 902 | Bid not found |
| 907 | Bid amount exceeds task budget |
| 909 | Dispute already open |

### arbitration (10xx)

| Code | Message |
| ---- | ------- |
| 1000 | Dispute not found |
| 1006 | Cannot dispute your own task |
| 1007 | Self-arbitration not allowed |

### synthetic-credit (11xx) · protocol-config (12xx)

| Code | Message |
| ---- | ------- |
| 1100 | Insufficient collateral |
| 1200 | Already initialized |
| 1201 | Unauthorized — deployer only |

---

## Usage in Components

```tsx
import { parseContractError, isErr } from "@/lib/parseError";

const { execute, error } = useAsyncCallback(async () => {
  const result = await readOnly(...);
  if (isErr(result)) throw new Error(parseContractError(result));
});
```
