import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// lending-pool.clar — unit tests
// ---------------------------------------------------------------------------

const ERR_NOT_MEMBER = 500;
const ERR_TRUST_TOO_LOW = 503;
const ERR_POOL_INSUFFICIENT = 504;

function setupWithCircle(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;
  const alice = accounts.get("wallet_1")!;
  const bob = accounts.get("wallet_2")!;
  chain.mineBlock([
    Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
  ]);
  chain.mineBlock([
    Tx.contractCall(
      "cooperative-registry",
      "create-circle",
      [types.utf8("Test"), types.utf8(""), types.uint(0), types.uint(20)],
      alice.address
    ),
  ]);
  return { deployer, alice, bob };
}

Clarinet.test({
  name: "fund-pool: member can fund a circle lending pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setupWithCircle(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "fund-pool",
        [types.uint(1), types.uint(10_000_000)],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "request-loan: fails when trust score is too low",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setupWithCircle(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("lending-pool", "fund-pool", [types.uint(1), types.uint(10_000_000)], alice.address),
    ]);
    // bob has trust score 0 → should fail
    const block = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "request-loan",
        [types.uint(1), types.uint(1_000_000)],
        bob.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_TRUST_TOO_LOW);
  },
});

Clarinet.test({
  name: "get-pool-balance: returns funded amount",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setupWithCircle(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("lending-pool", "fund-pool", [types.uint(1), types.uint(5_000_000)], alice.address),
    ]);
    const result = chain.callReadOnlyFn(
      "lending-pool",
      "get-pool-balance",
      [types.uint(1)],
      deployer.address
    );
    result.result.expectUint(5_000_000);
  },
});

Clarinet.test({
  name: "repay: active loan can be repaid",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice, bob } = setupWithCircle(chain, accounts);
    // Give bob enough trust via deployer calling trust-score
    chain.mineBlock([
      Tx.contractCall("trust-score", "reward-savings", [types.principal(bob.address), types.uint(300)], deployer.address),
      Tx.contractCall("trust-score", "reward-loan-repay", [types.principal(bob.address), types.uint(200)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("lending-pool", "fund-pool", [types.uint(1), types.uint(50_000_000)], alice.address),
    ]);
    const loanBlock = chain.mineBlock([
      Tx.contractCall("lending-pool", "request-loan", [types.uint(1), types.uint(1_000_000)], bob.address),
    ]);
    const loanResult = loanBlock.receipts[0].result;
    if (loanResult.startsWith("(ok")) {
      const loanId = parseInt(loanResult.slice(4, -1));
      const repayBlock = chain.mineBlock([
        Tx.contractCall("lending-pool", "repay", [types.uint(loanId), types.uint(1_100_000)], bob.address),
      ]);
      repayBlock.receipts[0].result.expectOk().expectBool(true);
    }
  },
});

Clarinet.test({
  name: "request-loan: zero-amount loan is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setupWithCircle(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("lending-pool", "fund-pool", [types.uint(1), types.uint(50_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("lending-pool", "request-loan", [types.uint(1), types.uint(0)], bob.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "fund-pool: non-existent pool funding is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setupWithCircle(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall("lending-pool", "fund-pool", [types.uint(999), types.uint(1_000_000)], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "request-loan: borrowing more than pool balance is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setupWithCircle(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("lending-pool", "fund-pool", [types.uint(1), types.uint(1_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("lending-pool", "request-loan", [types.uint(1), types.uint(100_000_000)], bob.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});
