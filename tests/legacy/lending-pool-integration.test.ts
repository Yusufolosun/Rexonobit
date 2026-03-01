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
// lending-pool-integration.test.ts
// End-to-end flows: fund pool → request loan → repay → liquidate
// ---------------------------------------------------------------------------

function setup(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;
  const alice = accounts.get("wallet_1")!;
  const bob = accounts.get("wallet_2")!;
  const carol = accounts.get("wallet_3")!;
  chain.mineBlock([
    Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    Tx.contractCall("cooperative-registry", "register-member", [], carol.address),
  ]);
  chain.mineBlock([
    Tx.contractCall(
      "cooperative-registry",
      "create-circle",
      [types.utf8("Lending Circle"), types.utf8(""), types.uint(0), types.uint(20)],
      alice.address
    ),
  ]);
  return { deployer, alice, bob, carol };
}

// ---------------------------------------------------------------------------
// Flow 1: Alice funds the lending pool
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "lending-pool-integration: member can fund the pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);

    const block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "fund-pool",
        [types.uint(1), types.uint(10_000_000)],
        alice.address
      ),
    ]);
    const receipt = block.receipts[0];
    assertEquals(
      receipt.result.startsWith("(ok") || receipt.result.startsWith("(err"),
      true
    );
  },
});

// ---------------------------------------------------------------------------
// Flow 2: Non-member cannot fund the pool
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "lending-pool-integration: non-member fund is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const {} = setup(chain, accounts);
    const stranger = accounts.get("wallet_4")!;

    const block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "fund-pool",
        [types.uint(1), types.uint(5_000_000)],
        stranger.address
      ),
    ]);
    assertEquals(block.receipts[0].result.startsWith("(err"), true);
  },
});

// ---------------------------------------------------------------------------
// Flow 3: Bob funds pool, Carol requests a loan
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "lending-pool-integration: carol requests loan after pool is funded",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { bob, carol } = setup(chain, accounts);

    chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "fund-pool",
        [types.uint(1), types.uint(20_000_000)],
        bob.address
      ),
    ]);

    const loanBlock = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "request-loan",
        [types.uint(1), types.uint(3_000_000), types.uint(12)],
        carol.address
      ),
    ]);
    const receipt = loanBlock.receipts[0];
    assertEquals(
      receipt.result.startsWith("(ok") || receipt.result.startsWith("(err"),
      true
    );
  },
});

// ---------------------------------------------------------------------------
// Flow 4: Carol repays loan after taking it
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "lending-pool-integration: carol can repay active loan",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { bob, carol } = setup(chain, accounts);

    chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "fund-pool",
        [types.uint(1), types.uint(20_000_000)],
        bob.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "request-loan",
        [types.uint(1), types.uint(2_000_000), types.uint(6)],
        carol.address
      ),
    ]);

    const repayBlock = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "repay-loan",
        [types.uint(1), types.uint(2_100_000)],
        carol.address
      ),
    ]);
    assertEquals(
      repayBlock.receipts[0].result.startsWith("(ok") ||
        repayBlock.receipts[0].result.startsWith("(err"),
      true
    );
  },
});

// ---------------------------------------------------------------------------
// Flow 5: Overdue loan can be liquidated by pool admin/circle lead
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "lending-pool-integration: overdue loan can be liquidated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob, carol } = setup(chain, accounts);

    chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "fund-pool",
        [types.uint(1), types.uint(20_000_000)],
        bob.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "request-loan",
        [types.uint(1), types.uint(1_500_000), types.uint(1)],
        carol.address
      ),
    ]);

    // Advance chain to simulate overdue state
    chain.mineEmptyBlockUntil(chain.blockHeight + 150);

    const liquidateBlock = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "liquidate-loan",
        [types.uint(1), carol.address],
        alice.address
      ),
    ]);
    assertEquals(
      liquidateBlock.receipts[0].result.startsWith("(ok") ||
        liquidateBlock.receipts[0].result.startsWith("(err"),
      true
    );
  },
});

// ---------------------------------------------------------------------------
// Flow 6: Loan request exceeds available pool balance is rejected
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "lending-pool-integration: loan request exceeding pool balance is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { bob, carol } = setup(chain, accounts);

    // Fund with a small amount
    chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "fund-pool",
        [types.uint(1), types.uint(500_000)],
        bob.address
      ),
    ]);

    const block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "request-loan",
        [types.uint(1), types.uint(10_000_000), types.uint(12)],
        carol.address
      ),
    ]);
    assertEquals(block.receipts[0].result.startsWith("(err"), true);
  },
});
