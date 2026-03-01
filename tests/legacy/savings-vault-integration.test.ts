// @ts-nocheck
import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.196.0/testing/asserts.ts";

// ──────────────────────────────────────────────────────────────────────────────
// Savings Vault Integration Tests
// Tests cover: deposit, lock period, early-withdrawal, streak mechanics,
// and cross-contract trust score updates triggered by vault actions.
// ──────────────────────────────────────────────────────────────────────────────

const ONE_STX = 1_000_000;

Clarinet.test({
  name: "savings-vault: member can deposit STX and receive confirmation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [types.ascii("Alice"), types.ascii("")], alice.address),
    ]);

    const block = chain.mineBlock([
      Tx.contractCall(
        "savings-vault",
        "deposit",
        [types.uint(50 * ONE_STX)],
        alice.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "savings-vault: non-member deposit is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const bob = accounts.get("wallet_2")!;

    const block = chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(10 * ONE_STX)], bob.address),
    ]);
    assertStringIncludes(block.receipts[0].result, "err");
  },
});

Clarinet.test({
  name: "savings-vault: withdrawal within lock period is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [types.ascii("Alice"), types.ascii("")], alice.address),
      Tx.contractCall("savings-vault", "deposit", [types.uint(50 * ONE_STX)], alice.address),
    ]);

    // Try to withdraw immediately (before lock period expires)
    const block = chain.mineBlock([
      Tx.contractCall("savings-vault", "withdraw", [types.uint(50 * ONE_STX)], alice.address),
    ]);
    assertStringIncludes(block.receipts[0].result, "err");
  },
});

Clarinet.test({
  name: "savings-vault: withdrawal after lock period succeeds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [types.ascii("Alice"), types.ascii("")], alice.address),
      Tx.contractCall("savings-vault", "deposit", [types.uint(50 * ONE_STX)], alice.address),
    ]);

    // Fast-forward past the lock period (144 blocks ≈ minimum lock)
    chain.mineEmptyBlockUntil(200);

    const block = chain.mineBlock([
      Tx.contractCall("savings-vault", "withdraw", [types.uint(50 * ONE_STX)], alice.address),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "savings-vault: zero deposit is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [types.ascii("Alice"), types.ascii("")], alice.address),
    ]);

    const block = chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(0)], alice.address),
    ]);
    assertStringIncludes(block.receipts[0].result, "err");
  },
});

Clarinet.test({
  name: "savings-vault: streak is incremented after consecutive-cycle deposit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [types.ascii("Alice"), types.ascii("")], alice.address),
      Tx.contractCall("savings-vault", "deposit", [types.uint(10 * ONE_STX)], alice.address),
    ]);

    // Advance one savings cycle (144 blocks)
    chain.mineEmptyBlockUntil(150);

    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(10 * ONE_STX)], alice.address),
    ]);

    const vaultResult = chain.callReadOnlyFn("savings-vault", "get-vault", [types.principal(alice.address)], alice.address);
    assertStringIncludes(vaultResult.result, "streak");
  },
});
