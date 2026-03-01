// @ts-nocheck
import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";

// ===========================
// ROSCA Integration Tests
// ===========================

Clarinet.test({
  name: "rosca-integration: create circle, register members, and contribute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;
    const carol = accounts.get("wallet_3")!;

    // Create a ROSCA circle
    let block = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "register-cooperative",
        [
          types.ascii("RoscaTest"),
          types.ascii("Integration test cooperative"),
        ],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok u1)");

    // Register members (alice, bob, carol)
    let block2 = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "add-member",
        [types.uint(1), types.principal(alice.address)],
        deployer.address
      ),
      Tx.contractCall(
        "cooperative-registry",
        "add-member",
        [types.uint(1), types.principal(bob.address)],
        deployer.address
      ),
      Tx.contractCall(
        "cooperative-registry",
        "add-member",
        [types.uint(1), types.principal(carol.address)],
        deployer.address
      ),
    ]);
    assertEquals(block2.receipts[0].result, "(ok true)");
    assertEquals(block2.receipts[1].result, "(ok true)");
    assertEquals(block2.receipts[2].result, "(ok true)");

    // Create ROSCA round
    let block3 = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "create-round",
        [
          types.uint(1),           // cooperative-id
          types.uint(1000000),     // contribution amount (1 STX)
          types.uint(10),          // interval in blocks
        ],
        deployer.address
      ),
    ]);
    assertEquals(block3.receipts[0].result, "(ok u1)");
  },
});

Clarinet.test({
  name: "rosca-integration: contribute funds and verify balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;

    // Setup: register cooperative and member
    chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "register-cooperative",
        [types.ascii("RoscaFund"), types.ascii("Fund test")],
        deployer.address
      ),
    ]);
    chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "add-member",
        [types.uint(1), types.principal(alice.address)],
        deployer.address
      ),
    ]);
    chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "create-round",
        [types.uint(1), types.uint(1000000), types.uint(5)],
        deployer.address
      ),
    ]);

    // Alice contributes
    let block = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "contribute",
        [types.uint(1)],           // round-id
        alice.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
    assertEquals(block.receipts[0].events[0].type, "stx_transfer_event");
  },
});

Clarinet.test({
  name: "rosca-integration: non-member cannot contribute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const outsider = accounts.get("wallet_5")!;

    chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "register-cooperative",
        [types.ascii("ClosedCircle"), types.ascii("Members only")],
        deployer.address
      ),
    ]);
    chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "create-round",
        [types.uint(1), types.uint(500000), types.uint(5)],
        deployer.address
      ),
    ]);

    // Outsider tries to contribute — should fail
    let block = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "contribute",
        [types.uint(1)],
        outsider.address
      ),
    ]);
    // Expect an err response
    assertEquals(block.receipts[0].result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "rosca-integration: payout flows to selected recipient",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    // Full setup
    chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "register-cooperative",
        [types.ascii("PayCircle"), types.ascii("Payout test")],
        deployer.address
      ),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "add-member", [types.uint(1), types.principal(alice.address)], deployer.address),
      Tx.contractCall("cooperative-registry", "add-member", [types.uint(1), types.principal(bob.address)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-round", [types.uint(1), types.uint(1000000), types.uint(2)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "contribute", [types.uint(1)], alice.address),
      Tx.contractCall("rosca", "contribute", [types.uint(1)], bob.address),
    ]);

    // Advance blocks past interval
    chain.mineEmptyBlockUntil(chain.blockHeight + 3);

    // Trigger payout to alice
    let block = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "disburse-payout",
        [types.uint(1), types.principal(alice.address)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
    const payoutEvent = block.receipts[0].events.find(
      (e: any) => e.type === "stx_transfer_event"
    );
    assertEquals(payoutEvent !== undefined, true);
    assertEquals(payoutEvent.stx_transfer_event.recipient, alice.address);
  },
});

Clarinet.test({
  name: "rosca-integration: delinquent member loses payout eligibility",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-cooperative", [types.ascii("DelinqCircle"), types.ascii("Delinquent test")], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "add-member", [types.uint(1), types.principal(alice.address)], deployer.address),
      Tx.contractCall("cooperative-registry", "add-member", [types.uint(1), types.principal(bob.address)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-round", [types.uint(1), types.uint(1000000), types.uint(2)], deployer.address),
    ]);

    // Only alice contributes — bob does not
    chain.mineBlock([
      Tx.contractCall("rosca", "contribute", [types.uint(1)], alice.address),
    ]);

    chain.mineEmptyBlockUntil(chain.blockHeight + 3);

    // Attempt payout to bob (delinquent) should fail
    let block = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "disburse-payout",
        [types.uint(1), types.principal(bob.address)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "rosca-integration: completed round cannot accept new contributions",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-cooperative", [types.ascii("CompletedCircle"), types.ascii("Completed test")], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "add-member", [types.uint(1), types.principal(alice.address)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-round", [types.uint(1), types.uint(1000000), types.uint(1)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "contribute", [types.uint(1)], alice.address),
    ]);
    chain.mineEmptyBlockUntil(chain.blockHeight + 2);
    chain.mineBlock([
      Tx.contractCall("rosca", "disburse-payout", [types.uint(1), types.principal(alice.address)], deployer.address),
    ]);

    // Mark round as completed
    chain.mineBlock([
      Tx.contractCall("rosca", "close-round", [types.uint(1)], deployer.address),
    ]);

    // Alice tries to contribute to closed round
    let block = chain.mineBlock([
      Tx.contractCall("rosca", "contribute", [types.uint(1)], alice.address),
    ]);
    assertEquals(block.receipts[0].result.startsWith("(err"), true);
  },
});
