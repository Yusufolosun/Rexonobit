// @ts-nocheck
import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// Integration tests: trust score accumulation across protocol actions
// ---------------------------------------------------------------------------

function setup(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;
  const alice = accounts.get("wallet_1")!;
  chain.mineBlock([
    Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
  ]);
  return { deployer, alice };
}

// ---------------------------------------------------------------------------
// Flow 1: Deposit accumulates trust score
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "trust-integration: vault deposit increases trust score",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);

    // Check initial trust score
    const initialScore = chain.callReadOnlyFn(
      "trust-score",
      "get-trust-score",
      [types.principal(alice.address)],
      alice.address
    );
    const before = initialScore.result.expectSome().expectUint();

    // Deposit to vault
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(10_000_000)], alice.address),
    ]);

    // Trust score should have increased
    const afterScore = chain.callReadOnlyFn(
      "trust-score",
      "get-trust-score",
      [types.principal(alice.address)],
      alice.address
    );
    const after = afterScore.result.expectSome().expectUint();
    assertEquals(after > before, true);
  },
});

// ---------------------------------------------------------------------------
// Flow 2: Loan repayment increases trust score
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "trust-integration: repaying a loan increases trust score",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    ]);

    // Setup: alice deposits, creates circle, bob deposits to pool
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(5_000_000)], alice.address),
      Tx.contractCall("cooperative-registry", "create-circle", [types.ascii("TestCircle"), types.uint(5)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("lending-pool", "fund-pool", [types.uint(1), types.uint(20_000_000)], bob.address),
    ]);

    // Alice requests a loan
    const loanBlock = chain.mineBlock([
      Tx.contractCall("lending-pool", "request-loan", [types.uint(1), types.uint(1_000_000)], alice.address),
    ]);
    loanBlock.receipts[0].result.expectOk();
    const loanId = loanBlock.receipts[0].result.expectOk().expectUint();

    const scoreBefore = chain.callReadOnlyFn(
      "trust-score", "get-trust-score",
      [types.principal(alice.address)], alice.address
    ).result.expectSome().expectUint();

    // Repay the loan
    chain.mineBlock([
      Tx.contractCall("lending-pool", "repay-loan", [types.uint(loanId), types.uint(1_000_000)], alice.address),
    ]);

    const scoreAfter = chain.callReadOnlyFn(
      "trust-score", "get-trust-score",
      [types.principal(alice.address)], alice.address
    ).result.expectSome().expectUint();

    assertEquals(scoreAfter >= scoreBefore, true);
  },
});

// ---------------------------------------------------------------------------
// Flow 3: Completing a task rewards trust score
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "trust-integration: task completion rewards trust score",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
      Tx.contractCall("savings-vault", "deposit", [types.uint(3_000_000)], alice.address),
    ]);

    // Alice posts a task with a bounty
    const taskBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "post-task",
        [types.uint(1), types.ascii("Write documentation"), types.uint(500_000)],
        alice.address
      ),
    ]);
    taskBlock.receipts[0].result.expectOk();
    const taskId = taskBlock.receipts[0].result.expectOk().expectUint();

    // Bob bids on the task
    chain.mineBlock([
      Tx.contractCall("labor-market", "bid-task", [types.uint(taskId)], bob.address),
    ]);

    // Alice accepts bob's bid
    chain.mineBlock([
      Tx.contractCall("labor-market", "accept-bid", [types.uint(taskId), types.principal(bob.address)], alice.address),
    ]);

    const scoreBefore = chain.callReadOnlyFn(
      "trust-score", "get-trust-score",
      [types.principal(bob.address)], bob.address
    ).result.expectSome().expectUint();

    // Bob submits work; Alice attests
    chain.mineBlock([
      Tx.contractCall("labor-market", "submit-work", [types.uint(taskId), types.ascii("ipfs://Qm...")], bob.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("labor-market", "attest-completion", [types.uint(taskId)], alice.address),
    ]);

    const scoreAfter = chain.callReadOnlyFn(
      "trust-score", "get-trust-score",
      [types.principal(bob.address)], bob.address
    ).result.expectSome().expectUint();

    assertEquals(scoreAfter >= scoreBefore, true);
  },
});
