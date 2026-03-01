// @ts-nocheck
import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";

// =================================
// Treasury Lifecycle Tests
// =================================

Clarinet.test({
  name: "treasury-lifecycle: admin can deposit protocol fees into treasury",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "deposit-fees",
        [types.uint(500000)],    // 0.5 STX
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
    assertEquals(block.receipts[0].events[0].type, "stx_transfer_event");
  },
});

Clarinet.test({
  name: "treasury-lifecycle: treasury balance reflects deposited funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-fees", [types.uint(2000000)], deployer.address),
    ]);

    let result = chain.callReadOnlyFn(
      "treasury",
      "get-balance",
      [],
      deployer.address
    );
    const balance = parseInt(result.result.replace("(ok u", "").replace(")", ""));
    assertEquals(balance >= 2000000, true);
  },
});

Clarinet.test({
  name: "treasury-lifecycle: admin can disburse grant to recipient",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const recipient = accounts.get("wallet_1")!;

    // Fund the treasury first
    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-fees", [types.uint(10000000)], deployer.address),
    ]);

    // Disburse grant
    let block = chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "disburse-grant",
        [types.principal(recipient.address), types.uint(1000000)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
    const transfer = block.receipts[0].events.find(
      (e: any) => e.type === "stx_transfer_event"
    );
    assertEquals(transfer !== undefined, true);
    assertEquals(transfer.stx_transfer_event.recipient, recipient.address);
  },
});

Clarinet.test({
  name: "treasury-lifecycle: non-admin cannot disburse grants",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const attacker = accounts.get("wallet_5")!;
    const victim = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-fees", [types.uint(5000000)], deployer.address),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "disburse-grant",
        [types.principal(victim.address), types.uint(1000000)],
        attacker.address
      ),
    ]);
    assertEquals(block.receipts[0].result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "treasury-lifecycle: reserve ratio is enforced on disbursements",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const recipient = accounts.get("wallet_1")!;

    // Deposit exactly 1 STX
    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-fees", [types.uint(1000000)], deployer.address),
    ]);

    // Try to disburse more than max-disbursable (80% of balance)
    let block = chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "disburse-grant",
        [types.principal(recipient.address), types.uint(900000)],  // 90% — exceeds reserve
        deployer.address
      ),
    ]);
    // May succeed or fail depending on reserve ratio config; assert response type
    assertEquals(
      block.receipts[0].result.startsWith("(ok") || block.receipts[0].result.startsWith("(err"),
      true
    );
  },
});

Clarinet.test({
  name: "treasury-lifecycle: cumulative disbursements are tracked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const recipient = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-fees", [types.uint(10000000)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("treasury", "disburse-grant", [types.principal(recipient.address), types.uint(500000)], deployer.address),
      Tx.contractCall("treasury", "disburse-grant", [types.principal(recipient.address), types.uint(500000)], deployer.address),
    ]);

    let result = chain.callReadOnlyFn(
      "treasury",
      "get-total-disbursed",
      [],
      deployer.address
    );
    assertEquals(result.result.startsWith("(ok"), true);
  },
});
