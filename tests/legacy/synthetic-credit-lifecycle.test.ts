// @ts-nocheck
import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";

// ===================================
// Synthetic Credit Lifecycle Tests
// ===================================

Clarinet.test({
  name: "synthetic-credit-lifecycle: eligible member receives a credit limit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;

    // Register cooperative and member
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-cooperative",
        [types.ascii("SCreditCoop"), types.ascii("Synthetic credit test")],
        deployer.address
      ),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "add-member",
        [types.uint(1), types.principal(alice.address)],
        deployer.address
      ),
    ]);

    // Issue credit line for alice
    let block = chain.mineBlock([
      Tx.contractCall(
        "synthetic-credit",
        "issue-credit-line",
        [types.principal(alice.address), types.uint(10000000)],   // 10 STX limit
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");

    // Verify credit limit is readable
    let result = chain.callReadOnlyFn(
      "synthetic-credit",
      "get-credit-limit",
      [types.principal(alice.address)],
      alice.address
    );
    assertEquals(result.result, "(ok u10000000)");
  },
});

Clarinet.test({
  name: "synthetic-credit-lifecycle: member draws against credit line",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-cooperative",
        [types.ascii("DrawCoop"), types.ascii("Draw test")], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "add-member",
        [types.uint(1), types.principal(alice.address)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("synthetic-credit", "issue-credit-line",
        [types.principal(alice.address), types.uint(5000000)], deployer.address),
    ]);

    // Draw 2 STX
    let block = chain.mineBlock([
      Tx.contractCall(
        "synthetic-credit",
        "draw",
        [types.uint(2000000)],
        alice.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");

    // Outstanding balance should be 2 STX
    let balance = chain.callReadOnlyFn(
      "synthetic-credit",
      "get-outstanding-balance",
      [types.principal(alice.address)],
      alice.address
    );
    assertEquals(balance.result, "(ok u2000000)");
  },
});

Clarinet.test({
  name: "synthetic-credit-lifecycle: cannot draw beyond credit limit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-cooperative",
        [types.ascii("LimitCoop"), types.ascii("Limit test")], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "add-member",
        [types.uint(1), types.principal(alice.address)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("synthetic-credit", "issue-credit-line",
        [types.principal(alice.address), types.uint(1000000)], deployer.address),
    ]);

    // Try to draw 5 STX when limit is 1 STX
    let block = chain.mineBlock([
      Tx.contractCall("synthetic-credit", "draw", [types.uint(5000000)], alice.address),
    ]);
    assertEquals(block.receipts[0].result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "synthetic-credit-lifecycle: member repays outstanding balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-cooperative",
        [types.ascii("RepayCoop"), types.ascii("Repay test")], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "add-member",
        [types.uint(1), types.principal(alice.address)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("synthetic-credit", "issue-credit-line",
        [types.principal(alice.address), types.uint(5000000)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("synthetic-credit", "draw", [types.uint(2000000)], alice.address),
    ]);

    // Repay partial (1 STX)
    let block = chain.mineBlock([
      Tx.contractCall(
        "synthetic-credit",
        "repay",
        [types.uint(1000000)],
        alice.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");

    // Outstanding should be 1 STX
    let balance = chain.callReadOnlyFn(
      "synthetic-credit",
      "get-outstanding-balance",
      [types.principal(alice.address)],
      alice.address
    );
    assertEquals(balance.result, "(ok u1000000)");
  },
});

Clarinet.test({
  name: "synthetic-credit-lifecycle: non-member cannot receive credit line",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const outsider = accounts.get("wallet_5")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "synthetic-credit",
        "issue-credit-line",
        [types.principal(outsider.address), types.uint(5000000)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result.startsWith("(err"), true);
  },
});
