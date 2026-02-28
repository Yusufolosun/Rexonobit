# types

**File:** `frontend/src/lib/types.ts`

## Purpose

Canonical TypeScript type definitions for all protocol domain objects. Import from here instead of redeclaring inline interfaces in components or hooks. This is the single source of truth for all REXONOBIT data shapes.

## Branded Primitives

| Type | Underlying | Description |
|------|-----------|-------------|
| `StacksPrincipal` | `string` | c32check-encoded Stacks address |
| `TxId` | `string` | 64-char hex transaction ID |
| `BlockHeight` | `number` | On-chain block height |

## Enums (Union String Types)

| Type | Values |
|------|--------|
| `TrustTier` | `"bronze" \| "silver" \| "gold" \| "platinum" \| "none"` |
| `LoanStatus` | `"active" \| "repaid" \| "defaulted"` |
| `RoscaStatus` | `"open" \| "active" \| "complete" \| "closed"` |
| `TaskStatus` | `"open" \| "assigned" \| "submitted" \| "complete" \| "disputed"` |
| `ProposalStatus` | `"active" \| "pending" \| "executed" \| "expired" \| "vetoed"` |
| `ProposalType` | `"PARAM-CHANGE" \| "TREASURY-SPEND" \| "EXPEL-MEMBER" \| "POLICY-UPDATE"` |
| `DisputeStatus` | `"open" \| "resolved" \| "closed"` |
| `TxStatus` | `"success" \| "abort_by_response" \| "abort_by_post_condition" \| "pending"` |

## Data Interfaces

| Interface | Key Fields |
|-----------|-----------|
| `TrustScoreData` | `total`, `tier: TrustTier`, component scores |
| `VaultData` | `balance`, `locked`, `available` (microSTX) |
| `Loan` | `id`, `amount`, `status: LoanStatus`, `borrower`, `poolId` |
| `LendingPool` | `id`, `totalFunds`, `availableFunds`, `interestRate` |
| `RoscaGroup` | `id`, `status: RoscaStatus`, `members[]`, `contributionAmount` |
| `Circle` | `id`, `name`, `memberCount`, `admin` |
| `Task` | `id`, `title`, `reward`, `status: TaskStatus`, `worker?` |
| `SpendProposal` | `id`, `recipient`, `amount`, `status: ProposalStatus` |
| `GovernanceProposal` | `id`, `proposalType: ProposalType`, `status`, `yesVotes`, `noVotes` |
| `Dispute` | `id`, `initiator`, `respondent`, `status: DisputeStatus`, `panelists[]` |
| `SCreditPosition` | `mintedAmount`, `creditCeiling`, `collateral` |
| `ProtocolStats` | `memberCount`, `tvl`, `activeLoans`, `openDisputes`, `nftsMinted` |
| `TxResult` | `txid: TxId`, `status: TxStatus` |

## Usage

```ts
import type { Loan, LoanStatus, TrustTier } from '../lib/types';

const activeLoan: Loan = { id: 1, status: "active", ... };
const tier: TrustTier = "gold";
```

## Notes

- Branded primitives require explicit casting: `address as StacksPrincipal`.
- All enum types are string unions (not TypeScript `enum`) for JSON compatibility.
