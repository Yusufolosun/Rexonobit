import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// labor-market dispute → arbitration integration test
// Verifies that dispute-task now opens a real dispute in the arbitration
// contract and records the dispute-id on the task.
// ---------------------------------------------------------------------------

function setup(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;
  const alice = accounts.get("wallet_1")!;
  const bob = accounts.get("wallet_2")!;

  // Initialize protocol and register members
  chain.mineBlock([
    Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
  ]);

  // Alice creates an open circle so Bob can join it directly
  chain.mineBlock([
    Tx.contractCall(
      "cooperative-registry",
      "create-circle",
      [types.utf8("Work Circle"), types.utf8("For task disputes"), types.bool(true), types.uint(0)],
      alice.address
    ),
  ]);

  // Bob joins the circle
  chain.mineBlock([
    Tx.contractCall(
      "cooperative-registry",
      "request-join",
      [types.uint(1)],
      bob.address
    ),
  ]);

  return { deployer, alice, bob };
}

/** Drive a task through post → bid → accept → submit-completion so it is in REVIEW. */
function postAndAdvanceToReview(
  chain: Chain,
  poster: Account,
  worker: Account
) {
  chain.mineBlock([
    Tx.contractCall(
      "labor-market",
      "post-task",
      [types.uint(1), types.utf8("Audit codebase"), types.utf8("Full security review"), types.uint(1_000_000)],
      poster.address
    ),
  ]);
  chain.mineBlock([
    Tx.contractCall("labor-market", "bid-task", [types.uint(1), types.utf8("I can do it")], worker.address),
  ]);
  chain.mineBlock([
    Tx.contractCall("labor-market", "accept-bid", [types.uint(1), types.principal(worker.address)], poster.address),
  ]);
  chain.mineBlock([
    Tx.contractCall("labor-market", "submit-completion", [types.uint(1)], worker.address),
  ]);
}

// ---------------------------------------------------------------------------
// Test: dispute-task opens a dispute in arbitration and stores the dispute-id
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "dispute-task opens an arbitration dispute and records dispute-id on the task",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    postAndAdvanceToReview(chain, alice, bob);

    // Alice disputes the task (poster is the claimant, worker is the respondent)
    const disputeBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "dispute-task",
        [
          types.uint(1),
          types.utf8("Deliverables are incomplete"),
          types.utf8("Missing unit tests and documentation"),
        ],
        alice.address
      ),
    ]);

    // dispute-task should return (ok dispute-id)
    disputeBlock.receipts[0].result.expectOk().expectUint(1);

    // Verify the task now has status DISPUTED (u5) and dispute-id set
    const taskQuery = chain.callReadOnlyFn(
      "labor-market", "get-task", [types.uint(1)], alice.address
    );
    const task = taskQuery.result.expectSome().expectTuple();
    assertEquals(task["status"], types.uint(5));
    assertEquals(task["dispute-id"], types.uint(1));

    // Verify the arbitration contract actually has the dispute
    const disputeQuery = chain.callReadOnlyFn(
      "arbitration", "get-dispute", [types.uint(1)], alice.address
    );
    const dispute = disputeQuery.result.expectSome().expectTuple();
    assertEquals(dispute["status"], types.uint(1)); // DISPUTE-OPEN
  },
});
