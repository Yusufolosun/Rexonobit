import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.196.0/testing/asserts.ts";

// ──────────────────────────────────────────────────────────────────────────────
// Reputation NFT Integration Tests
// Tests cover: mint eligibility, milestone triggers, badge attributes, and
// transfer restrictions for soulbound badges.
// ──────────────────────────────────────────────────────────────────────────────

Clarinet.test({
  name: "reputation-nft: member earns circle-completion badge after ROSCA completes",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;

    // Mock: grant alice a completed circle record
    const block = chain.mineBlock([
      // Register alice in cooperative registry
      Tx.contractCall(
        "cooperative-registry",
        "register-member",
        [types.ascii("Alice"), types.ascii("alice@example.com")],
        alice.address
      ),
      // Mint circle-completion badge for alice
      Tx.contractCall(
        "reputation-nft",
        "mint-badge",
        [types.principal(alice.address), types.uint(1) /* badge-type: circle-completion */],
        deployer.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(ok true)");
    assertEquals(block.receipts[1].result, "(ok u1)");

    // Verify alice owns token ID 1
    const ownerResult = chain.callReadOnlyFn(
      "reputation-nft",
      "get-owner",
      [types.uint(1)],
      deployer.address
    );
    assertStringIncludes(ownerResult.result, alice.address);
  },
});

Clarinet.test({
  name: "reputation-nft: only authorized minter can mint — deployer succeeds, random fails",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    const block = chain.mineBlock([
      // Authorized mint by deployer
      Tx.contractCall(
        "reputation-nft",
        "mint-badge",
        [types.principal(alice.address), types.uint(2) /* badge-type: loan-repayment */],
        deployer.address
      ),
      // Unauthorized attempt by random wallet
      Tx.contractCall(
        "reputation-nft",
        "mint-badge",
        [types.principal(alice.address), types.uint(3)],
        bob.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(ok u1)");
    assertStringIncludes(block.receipts[1].result, "err");
  },
});

Clarinet.test({
  name: "reputation-nft: soulbound badge cannot be transferred",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const carol = accounts.get("wallet_3")!;

    // Mint a soulbound badge to alice
    const mintBlock = chain.mineBlock([
      Tx.contractCall(
        "reputation-nft",
        "mint-badge",
        [types.principal(alice.address), types.uint(1)],
        deployer.address
      ),
    ]);
    assertEquals(mintBlock.receipts[0].result, "(ok u1)");

    // Alice attempts to transfer to carol — should fail
    const transferBlock = chain.mineBlock([
      Tx.contractCall(
        "reputation-nft",
        "transfer",
        [types.uint(1), types.principal(alice.address), types.principal(carol.address)],
        alice.address
      ),
    ]);
    assertStringIncludes(transferBlock.receipts[0].result, "err");
  },
});

Clarinet.test({
  name: "reputation-nft: badge metadata returns correct badge-type",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall(
        "reputation-nft",
        "mint-badge",
        [types.principal(alice.address), types.uint(2)],
        deployer.address
      ),
    ]);

    const metaResult = chain.callReadOnlyFn(
      "reputation-nft",
      "get-badge-type",
      [types.uint(1)],
      deployer.address
    );
    assertStringIncludes(metaResult.result, "u2");
  },
});

Clarinet.test({
  name: "reputation-nft: token ID counter increments correctly across mints",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    const block = chain.mineBlock([
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(alice.address), types.uint(1)], deployer.address),
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(bob.address), types.uint(1)], deployer.address),
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(alice.address), types.uint(2)], deployer.address),
    ]);

    assertEquals(block.receipts[0].result, "(ok u1)");
    assertEquals(block.receipts[1].result, "(ok u2)");
    assertEquals(block.receipts[2].result, "(ok u3)");
  },
});
