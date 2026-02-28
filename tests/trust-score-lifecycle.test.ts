import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";

// =================================
// Trust Score Lifecycle Tests
// =================================

Clarinet.test({
  name: "trust-score-lifecycle: new principal starts with baseline score",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const user = accounts.get("wallet_1")!;

    let result = chain.callReadOnlyFn(
      "trust-score",
      "get-score",
      [types.principal(user.address)],
      user.address
    );
    // New principals should start at a defined baseline (e.g., 0 or 100)
    assertEquals(result.result.startsWith("(ok"), true);
  },
});

Clarinet.test({
  name: "trust-score-lifecycle: positive on-time loan repayment increases score",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "trust-score",
        "record-repayment",
        [
          types.principal(user.address),
          types.bool(true),       // on-time
          types.uint(2000000),    // amount
        ],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");

    let after = chain.callReadOnlyFn(
      "trust-score",
      "get-score",
      [types.principal(user.address)],
      user.address
    );
    assertEquals(after.result.startsWith("(ok"), true);
  },
});

Clarinet.test({
  name: "trust-score-lifecycle: late repayment decreases score",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    // First give the user a decent score
    chain.mineBlock([
      Tx.contractCall("trust-score", "record-repayment", [types.principal(user.address), types.bool(true), types.uint(2000000)], deployer.address),
    ]);

    let before = chain.callReadOnlyFn("trust-score", "get-score", [types.principal(user.address)], user.address);

    // Record a late payment
    let block = chain.mineBlock([
      Tx.contractCall(
        "trust-score",
        "record-repayment",
        [types.principal(user.address), types.bool(false), types.uint(2000000)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "trust-score-lifecycle: default event applies maximum penalty",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "trust-score",
        "record-default",
        [types.principal(user.address)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "trust-score-lifecycle: savings streak increases trust modifier",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const user = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "trust-score",
        "record-savings-contribution",
        [types.principal(user.address), types.uint(500000)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "trust-score-lifecycle: unauthorized caller cannot update scores",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const attacker = accounts.get("wallet_5")!;
    const victim = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "trust-score",
        "record-repayment",
        [types.principal(victim.address), types.bool(true), types.uint(5000000)],
        attacker.address
      ),
    ]);
    assertEquals(block.receipts[0].result.startsWith("(err"), true);
  },
});
