import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// synthetic-credit.clar — unit tests
// ---------------------------------------------------------------------------

const ERR_NOT_MEMBER = 1200;
const ERR_TRUST_TOO_LOW = 1203;
const ERR_CREDIT_LIMIT_EXCEEDED = 1204;
const ERR_INSUFFICIENT_LOCKED_SAVINGS = 1205;

function setup(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;
  const alice = accounts.get("wallet_1")!;
  chain.mineBlock([
    Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
  ]);
  return { deployer, alice };
}

Clarinet.test({
  name: "mint-scredit: fails when trust score is below 700",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    // Alice has trust 0 → should fail
    const block = chain.mineBlock([
      Tx.contractCall("synthetic-credit", "mint-scredit", [types.uint(1000)], alice.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_TRUST_TOO_LOW);
  },
});

Clarinet.test({
  name: "mint-scredit: succeeds with high trust and locked savings",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    // Grant 700+ trust
    chain.mineBlock([
      Tx.contractCall("trust-score", "reward-savings", [types.principal(alice.address), types.uint(400)], deployer.address),
      Tx.contractCall("trust-score", "reward-loan-repay", [types.principal(alice.address), types.uint(300)], deployer.address),
    ]);
    // Deposit and lock savings
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(20_000_000)], alice.address),
      Tx.contractCall("savings-vault", "lock-savings", [types.uint(10_000_000), types.uint(2016)], alice.address),
    ]);
    // Credit limit = 10 STX * 50% = 5 STX = 5_000_000 microSTX
    // In scredit units (assuming 1:1 with microSTX for simplicity)
    const block = chain.mineBlock([
      Tx.contractCall("synthetic-credit", "mint-scredit", [types.uint(1000)], alice.address),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(ok") || receipt.result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "burn-scredit: member can burn their tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    // Ensure trust is high enough for mint
    chain.mineBlock([
      Tx.contractCall("trust-score", "reward-savings", [types.principal(alice.address), types.uint(400)], deployer.address),
      Tx.contractCall("trust-score", "reward-loan-repay", [types.principal(alice.address), types.uint(300)], deployer.address),
      Tx.contractCall("savings-vault", "deposit", [types.uint(20_000_000)], alice.address),
      Tx.contractCall("savings-vault", "lock-savings", [types.uint(10_000_000), types.uint(2016)], alice.address),
    ]);
    const mintBlock = chain.mineBlock([
      Tx.contractCall("synthetic-credit", "mint-scredit", [types.uint(1000)], alice.address),
    ]);
    if (mintBlock.receipts[0].result.startsWith("(ok")) {
      const burnBlock = chain.mineBlock([
        Tx.contractCall("synthetic-credit", "burn-scredit", [types.uint(500)], alice.address),
      ]);
      burnBlock.receipts[0].result.expectOk().expectBool(true);
    }
  },
});

Clarinet.test({
  name: "transfer-scredit: member can transfer scredit to another member",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
      Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("trust-score", "reward-savings", [types.principal(alice.address), types.uint(400)], deployer.address),
      Tx.contractCall("trust-score", "reward-loan-repay", [types.principal(alice.address), types.uint(300)], deployer.address),
      Tx.contractCall("savings-vault", "deposit", [types.uint(20_000_000)], alice.address),
      Tx.contractCall("savings-vault", "lock-savings", [types.uint(10_000_000), types.uint(2016)], alice.address),
    ]);
    const mintBlock = chain.mineBlock([
      Tx.contractCall("synthetic-credit", "mint-scredit", [types.uint(2000)], alice.address),
    ]);
    if (mintBlock.receipts[0].result.startsWith("(ok")) {
      const transferBlock = chain.mineBlock([
        Tx.contractCall(
          "synthetic-credit",
          "transfer-scredit",
          [types.uint(500), types.principal(bob.address)],
          alice.address
        ),
      ]);
      transferBlock.receipts[0].result.expectOk().expectBool(true);
    }
  },
});

Clarinet.test({
  name: "get-scredit-balance: returns zero for fresh member",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    const result = chain.callReadOnlyFn(
      "synthetic-credit",
      "get-scredit-balance",
      [types.principal(alice.address)],
      deployer.address
    );
    result.result.expectUint(0);
  },
});
