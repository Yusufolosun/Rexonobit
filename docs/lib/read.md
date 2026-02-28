# read

**File:** `frontend/src/lib/read.ts`

## Purpose

Read-only contract call helpers. Wraps `callReadOnlyFunction` (Stacks RPC) for all 12 REXONOBIT contracts, providing typed return values. These calls are free (no STX fee) and require no wallet connection.

## Core Helper

### `readOnlyCall<T>(opts, parse): Promise<T>`

Internal generic wrapper. Calls `POST /v2/contracts/call-read/:addr/:name/:fn` and runs a parse function on the Clarity result string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `opts.contractName` | `ContractName` | Target contract |
| `opts.functionName` | `string` | Clarity function name |
| `opts.args` | `string[]` | Hex-encoded Clarity args |
| `opts.sender` | `string` | Optional caller principal |
| `parse` | `(result: string) => T` | Parses the `result` hex string |

## Contract-Specific Read Functions

| Function | Contract | Returns |
|----------|----------|---------|
| `getVaultBalance(address)` | `savings-vault` | `number` (microSTX) |
| `getTrustScore(address)` | `trust-score` | `TrustScoreData` |
| `getLoans(address)` | `lending-pool` | `Loan[]` |
| `getPool(poolId)` | `lending-pool` | `LendingPool \| null` |
| `getRoscaGroup(groupId)` | `rosca` | `RoscaGroup \| null` |
| `getMyRoscas(address)` | `rosca` | `RoscaGroup[]` |
| `getTasks(status?)` | `labor-market` | `Task[]` |
| `getProposals()` | `governance` | `GovernanceProposal[]` |
| `getSpendProposals()` | `treasury` | `SpendProposal[]` |
| `getDisputes(status?)` | `arbitration` | `Dispute[]` |
| `getSCreditPosition(address)` | `synthetic-credit` | `SCreditPosition` |
| `getMember(address)` | `cooperative-registry` | `object \| null` |

## Usage

```ts
import { getTrustScore } from '../lib/read';

const score = await getTrustScore(userAddress);
console.log(score.total, score.tier);
```

## Notes

- All functions return sensible defaults (`0`, `[]`, `null`) on API error — never throw.
- Hooks (e.g. `useTrustScore`) call these functions in `useEffect` and expose `isLoading` / `error` state.
