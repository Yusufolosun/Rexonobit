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
// Integration tests: synthetic credit (sCREDIT) mint / burn flows
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
// Flow 1: Deposit and lock STX, then mint sCREDIT within ceiling
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "scredit-integration: lock savings then mint sCREDIT within collateral ceiling",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);

    // Deposit and lock 10 STX for 100 blocks
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(10_000_000)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("savings-vault", "lock-savings", [types.uint(10_000_000), types.uint(100)], alice.address),
    ]);

    // Check collateral ceiling
    const ceiling = chain.callReadOnlyFn(
      "synthetic-credit",
      "get-collateral-ceiling",
      [types.principal(alice.address)],
      alice.address
    );
    ceiling.result.expectSome();

    // Mint sCREDIT within ceiling
    const mintBlock = chain.mineBlock([
      Tx.contractCall("synthetic-credit", "mint", [types.uint(1_000_000)], alice.address),
    ]);
    mintBlock.receipts[0].result.expectOk();

    // Balance should now be non-zero
    const balance = chain.callReadOnlyFn(
      "synthetic-credit",
      "get-balance",
      [types.principal(alice.address)],
      alice.address
    );
    assertEquals(Number(balance.result.expectOk().expectUint()) > 0, true);
  },
});

// ---------------------------------------------------------------------------
// Flow 2: Minting over collateral ceiling is rejected
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "scredit-integration: minting over collateral ceiling fails",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);

    // Deposit only a small amount (low collateral ceiling)
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(1_000_000)], alice.address),
      Tx.contractCall("savings-vault", "lock-savings", [types.uint(1_000_000), types.uint(50)], alice.address),
    ]);

    // Attempt to mint far beyond ceiling
    const mintBlock = chain.mineBlock([
      Tx.contractCall("synthetic-credit", "mint", [types.uint(1_000_000_000)], alice.address),
    ]);
    mintBlock.receipts[0].result.expectErr();
  },
});

// ---------------------------------------------------------------------------
// Flow 3: Mint then burn reduces balance to zero
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "scredit-integration: burn after mint reduces sCREDIT balance to zero",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);

    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(10_000_000)], alice.address),
      Tx.contractCall("savings-vault", "lock-savings", [types.uint(10_000_000), types.uint(100)], alice.address),
    ]);

    const mintAmount = 500_000;

    // Mint
    chain.mineBlock([
      Tx.contractCall("synthetic-credit", "mint", [types.uint(mintAmount)], alice.address),
    ]);

    // Burn same amount
    const burnBlock = chain.mineBlock([
      Tx.contractCall("synthetic-credit", "burn", [types.uint(mintAmount)], alice.address),
    ]);
    burnBlock.receipts[0].result.expectOk();

    // Balance should be zero
    const balance = chain.callReadOnlyFn(
      "synthetic-credit",
      "get-balance",
      [types.principal(alice.address)],
      alice.address
    );
    assertEquals(Number(balance.result.expectOk().expectUint()), 0);
  },
});
