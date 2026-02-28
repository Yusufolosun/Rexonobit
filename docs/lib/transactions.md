# transactions

**File:** `frontend/src/lib/transactions.ts`

## Purpose

Transaction builders for every write function across all 12 REXONOBIT contracts. Each helper constructs typed Clarity arguments and invokes `openContractCall` from `@stacks/connect`, triggering the Hiro Wallet extension signing flow. Transactions are never broadcast without explicit user approval.

## Pattern

Every function follows this signature:

```ts
async function doSomething(params): Promise<{ txid: string }>
```

## Savings Vault Transactions

| Function | Clarity call | Key args |
|----------|-------------|---------|
| `depositToVault(amount)` | `savings-vault.deposit` | `uint amount` |
| `withdrawFromVault(amount)` | `savings-vault.withdraw` | `uint amount` |
| `lockInVault(amount)` | `savings-vault.lock` | `uint amount` |

## Lending Pool Transactions

| Function | Clarity call |
|----------|-------------|
| `fundPool(poolId, amount)` | `lending-pool.fund-pool` |
| `requestLoan(poolId, amount)` | `lending-pool.request-loan` |
| `repayLoan(loanId, amount)` | `lending-pool.repay-loan` |
| `liquidateLoan(loanId)` | `lending-pool.liquidate` |

## ROSCA Transactions

| Function | Clarity call |
|----------|-------------|
| `createRoscaGroup(params)` | `rosca.create-group` |
| `joinRosca(groupId)` | `rosca.join-group` |
| `lockAndStartRosca(groupId)` | `rosca.lock-and-start` |
| `contributeToRosca(groupId)` | `rosca.contribute` |
| `setPayoutOrder(groupId, order)` | `rosca.set-order` |
| `triggerRoscaPayout(groupId)` | `rosca.trigger-payout` |

## Labor Market Transactions

| Function | Clarity call |
|----------|-------------|
| `createTask(params)` | `labor-market.create-task` |
| `assignTask(taskId, worker)` | `labor-market.assign-task` |
| `submitTaskWork(taskId, proof)` | `labor-market.submit-work` |
| `approveTaskWork(taskId)` | `labor-market.approve-work` |
| `disputeTask(taskId, reason)` | `labor-market.dispute-task` |
| `cancelTask(taskId)` | `labor-market.cancel-task` |

## Governance Transactions

| Function | Clarity call |
|----------|-------------|
| `createProposal(params)` | `governance.create-proposal` |
| `voteOnProposal(id, vote)` | `governance.cast-vote` |
| `vetoProposal(id)` | `governance.veto` |
| `executeProposal(id)` | `governance.execute` |

## Treasury Transactions

| Function | Clarity call |
|----------|-------------|
| `createSpendProposal(params)` | `treasury.propose-spend` |
| `approveSpend(id)` | `treasury.approve` |
| `rejectSpend(id)` | `treasury.reject` |
| `executeSpend(id)` | `treasury.execute-spend` |

## Arbitration Transactions

| Function | Clarity call |
|----------|-------------|
| `openDispute(respondent, reason)` | `arbitration.open-dispute` |
| `joinArbitrationPanel(disputeId)` | `arbitration.join-panel` |
| `submitVerdict(disputeId, verdict)` | `arbitration.submit-verdict` |
| `closeDispute(disputeId)` | `arbitration.close-dispute` |

## Synthetic Credit Transactions

| Function | Clarity call |
|----------|-------------|
| `mintSCredit(amount)` | `synthetic-credit.mint` |
| `burnSCredit(amount)` | `synthetic-credit.burn` |

## Usage

```ts
import { depositToVault } from '../lib/transactions';
const { txid } = await depositToVault(5_000_000); // 5 STX
```

## Notes

- All functions use `AnchorMode.Any` and `PostConditionMode.Allow` for flexibility.
- The `network` singleton from `network.ts` is passed to every call.
- `userSession` from `wallet.ts` provides the signing principal.
- On rejection by the user the promise resolves with `{ txid: "" }`.
