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
// Cooperative Registry Integration Tests
// Tests cover: member registration, duplicate guard, profile update, deactivation,
// and cross-contract membership checks used by lending-pool and rosca.
// ──────────────────────────────────────────────────────────────────────────────

Clarinet.test({
  name: "cooperative-registry: new member can register with valid name",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const alice = accounts.get("wallet_1")!;

    const block = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "register-member",
        [types.ascii("Alice Mwangi"), types.ascii("alice@cooperative.io")],
        alice.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");

    const memberResult = chain.callReadOnlyFn(
      "cooperative-registry",
      "get-member",
      [types.principal(alice.address)],
      alice.address
    );
    assertStringIncludes(memberResult.result, "Alice Mwangi");
  },
});

Clarinet.test({
  name: "cooperative-registry: duplicate registration is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [types.ascii("Alice"), types.ascii("")], alice.address),
    ]);

    // Second registration attempt by same address
    const block = chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [types.ascii("Alice2"), types.ascii("")], alice.address),
    ]);
    assertStringIncludes(block.receipts[0].result, "err");
  },
});

Clarinet.test({
  name: "cooperative-registry: member can update profile name",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [types.ascii("Alice"), types.ascii("")], alice.address),
    ]);

    const block = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "update-profile",
        [types.ascii("Alice Updated"), types.ascii("new@example.com")],
        alice.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "cooperative-registry: unregistered member cannot update profile",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const bob = accounts.get("wallet_2")!;

    const block = chain.mineBlock([
      Tx.contractCall("cooperative-registry", "update-profile", [types.ascii("Bob"), types.ascii("")], bob.address),
    ]);
    assertStringIncludes(block.receipts[0].result, "err");
  },
});

Clarinet.test({
  name: "cooperative-registry: admin can deactivate a member",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;

    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [types.ascii("Alice"), types.ascii("")], alice.address),
    ]);

    const block = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "deactivate-member",
        [types.principal(alice.address)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "cooperative-registry: is-member returns false for unregistered principal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const carol = accounts.get("wallet_3")!;

    const result = chain.callReadOnlyFn(
      "cooperative-registry",
      "is-member",
      [types.principal(carol.address)],
      deployer.address
    );
    assertEquals(result.result, "false");
  },
});
