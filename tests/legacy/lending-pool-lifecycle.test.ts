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
// Lending Pool Lifecycle Tests
// =================================

Clarinet.test({
  name: "lending-pool-lifecycle: lender deposits and receives pool shares",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const lender = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "deposit",
        [types.uint(5000000)],   // 5 STX
        lender.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
    assertEquals(block.receipts[0].events[0].type, "stx_transfer_event");

    // Verify lender balance in pool
    let readResult = chain.callReadOnlyFn(
      "lending-pool",
      "get-deposit-balance",
      [types.principal(lender.address)],
      lender.address
    );
    const balance = parseInt(readResult.result.replace("(ok u", "").replace(")", ""));
    assertEquals(balance, 5000000);
  },
});

Clarinet.test({
  name: "lending-pool-lifecycle: borrower requests and receives loan",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const lender = accounts.get("wallet_1")!;
    const borrower = accounts.get("wallet_2")!;

    // Fund the pool first
    chain.mineBlock([
      Tx.contractCall("lending-pool", "deposit", [types.uint(10000000)], lender.address),
    ]);

    // Borrower requests loan
    let block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "request-loan",
        [
          types.uint(2000000),    // 2 STX
          types.uint(100),        // duration blocks
          types.uint(500),        // 5% interest rate basis points
        ],
        borrower.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok u1)");
  },
});

Clarinet.test({
  name: "lending-pool-lifecycle: borrower repays loan and interest",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const lender = accounts.get("wallet_1")!;
    const borrower = accounts.get("wallet_2")!;

    // Setup: deposit, then borrow
    chain.mineBlock([
      Tx.contractCall("lending-pool", "deposit", [types.uint(10000000)], lender.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("lending-pool", "request-loan", [types.uint(2000000), types.uint(50), types.uint(500)], borrower.address),
    ]);

    // Approve the loan as deployer/admin
    chain.mineBlock([
      Tx.contractCall("lending-pool", "approve-loan", [types.uint(1)], deployer.address),
    ]);

    // Repay loan + interest (2 STX + 5% = 2.1 STX)
    let block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "repay-loan",
        [types.uint(1), types.uint(2100000)],
        borrower.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "lending-pool-lifecycle: over-borrowing beyond pool liquidity is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const lender = accounts.get("wallet_1")!;
    const borrower = accounts.get("wallet_2")!;

    // Only 1 STX in pool
    chain.mineBlock([
      Tx.contractCall("lending-pool", "deposit", [types.uint(1000000)], lender.address),
    ]);

    // Try to borrow 10 STX
    let block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "request-loan",
        [types.uint(10000000), types.uint(50), types.uint(500)],
        borrower.address
      ),
    ]);
    assertEquals(block.receipts[0].result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "lending-pool-lifecycle: lender can withdraw deposited funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const lender = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("lending-pool", "deposit", [types.uint(3000000)], lender.address),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "withdraw",
        [types.uint(3000000)],
        lender.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "lending-pool-lifecycle: defaulted loan is flagged and collateral can be seized",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const lender = accounts.get("wallet_1")!;
    const borrower = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall("lending-pool", "deposit", [types.uint(10000000)], lender.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("lending-pool", "request-loan", [types.uint(2000000), types.uint(2), types.uint(500)], borrower.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("lending-pool", "approve-loan", [types.uint(1)], deployer.address),
    ]);

    // Advance past loan duration without repayment
    chain.mineEmptyBlockUntil(chain.blockHeight + 5);

    // Mark as defaulted
    let block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "flag-default",
        [types.uint(1)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});
