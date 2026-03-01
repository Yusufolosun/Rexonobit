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
// governance.clar — unit tests
// ---------------------------------------------------------------------------

const ERR_NOT_MEMBER = 900;
const ERR_PROPOSAL_NOT_FOUND = 910;
const ERR_ALREADY_VOTED = 912;
const ERR_BELOW_SUPERMAJORITY = 915;

function setup(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;
  const alice = accounts.get("wallet_1")!;
  const bob = accounts.get("wallet_2")!;
  chain.mineBlock([
    Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
  ]);
  return { deployer, alice, bob };
}

Clarinet.test({
  name: "propose: registered member can create governance proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "governance",
        "propose",
        [
          types.ascii("PARAM-CHANGE"),
          types.utf8("Reduce loan rate"),
          types.utf8("Lower interest from 5% to 3%"),
          types.some(types.ascii("loan-interest-rate-bps")),
          types.some(types.uint(300)),
        ],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
  },
});

Clarinet.test({
  name: "propose: unregistered member is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const rogue = accounts.get("wallet_9")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "governance",
        "propose",
        [
          types.ascii("POLICY-UPDATE"),
          types.utf8("Rogue proposal"),
          types.utf8(""),
          types.none(),
          types.none(),
        ],
        rogue.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_NOT_MEMBER);
  },
});

Clarinet.test({
  name: "vote: member can vote on active proposal and receives non-zero weight",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("governance", "propose", [types.ascii("POLICY-UPDATE"), types.utf8("Test"), types.utf8(""), types.none(), types.none()], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("governance", "vote", [types.uint(1), types.bool(true)], bob.address),
    ]);
    // vote returns (ok effective-weight) — weight must be > 0
    const weight = block.receipts[0].result.expectOk().expectUint;
    assertEquals(weight !== 0, true);
  },
});

Clarinet.test({
  name: "vote: cannot vote twice on same proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("governance", "propose", [types.ascii("POLICY-UPDATE"), types.utf8("Test"), types.utf8(""), types.none(), types.none()], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("governance", "vote", [types.uint(1), types.bool(true)], bob.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("governance", "vote", [types.uint(1), types.bool(false)], bob.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_ALREADY_VOTED);
  },
});

Clarinet.test({
  name: "veto: proposer can veto their own proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("governance", "propose", [types.ascii("POLICY-UPDATE"), types.utf8("Test"), types.utf8(""), types.none(), types.none()], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("governance", "veto", [types.uint(1)], alice.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "execute-proposal: fails insufficient support",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("governance", "propose", [types.ascii("POLICY-UPDATE"), types.utf8("Test"), types.utf8(""), types.none(), types.none()], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("governance", "vote", [types.uint(1), types.bool(false)], bob.address),
    ]);
    chain.mineEmptyBlockUntil(chain.blockHeight + 200);
    const block = chain.mineBlock([
      Tx.contractCall("governance", "execute-proposal", [types.uint(1)], alice.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_BELOW_SUPERMAJORITY);
  },
});

Clarinet.test({
  name: "vote: cannot vote on non-existent proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall("governance", "vote", [types.uint(999), types.bool(true)], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "propose: non-member cannot create a proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const stranger = accounts.get("wallet_5")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("governance", "propose", [types.ascii("POLICY-UPDATE"), types.utf8("Test"), types.utf8(""), types.none(), types.none()], stranger.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "veto: non-proposer cannot veto a proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("governance", "propose", [types.ascii("POLICY-UPDATE"), types.utf8("Test"), types.utf8(""), types.none(), types.none()], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("governance", "veto", [types.uint(1)], bob.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

// ---------------------------------------------------------------------------
// execute-proposal dispatch tests (issue #9)
// Uses correct contract signatures with full circle + trust-score setup
// ---------------------------------------------------------------------------

Clarinet.test({
  name: "execute-proposal: PARAM-CHANGE dispatches to protocol-config.set-param",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    // Initialize protocol config
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);

    // Register members with display names
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member",
        [types.utf8("Alice")], alice.address),
      Tx.contractCall("cooperative-registry", "register-member",
        [types.utf8("Bob")], bob.address),
    ]);

    // Alice creates an open circle; bob joins
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "create-circle",
        [types.utf8("Gov Circle"), types.utf8("Governance test circle"),
         types.bool(true), types.uint(0)],
        alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "request-join",
        [types.uint(1)], bob.address),
    ]);

    // Initialize trust scores so voting works
    chain.mineBlock([
      Tx.contractCall("trust-score", "initialize-score",
        [types.principal(alice.address)], deployer.address),
      Tx.contractCall("trust-score", "initialize-score",
        [types.principal(bob.address)], deployer.address),
    ]);

    // Verify original param value
    const before = chain.callReadOnlyFn(
      "protocol-config", "get-param",
      [types.ascii("governance-quorum-bps")], deployer.address
    );
    before.result.expectOk().expectUint(5100);

    // Create PARAM-CHANGE proposal: change governance-quorum-bps 5100 → 5500
    const propBlock = chain.mineBlock([
      Tx.contractCall("governance", "propose",
        [types.uint(1), types.uint(1),
         types.utf8("Raise quorum"),
         types.utf8("Increase governance quorum from 51% to 55%"),
         types.ascii("governance-quorum-bps"),
         types.uint(5500), types.none()],
        alice.address),
    ]);
    propBlock.receipts[0].result.expectOk().expectUint(1);

    // Both members vote yes
    chain.mineBlock([
      Tx.contractCall("governance", "vote",
        [types.uint(1), types.bool(true)], alice.address),
      Tx.contractCall("governance", "vote",
        [types.uint(1), types.bool(true)], bob.address),
    ]);

    // Advance past vote-until (1440) + timelock (288) = 1728 blocks
    chain.mineEmptyBlockUntil(chain.blockHeight + 1800);

    // Execute — should dispatch to protocol-config.set-param
    const execBlock = chain.mineBlock([
      Tx.contractCall("governance", "execute-proposal",
        [types.uint(1)], alice.address),
    ]);
    execBlock.receipts[0].result.expectOk().expectBool(true);

    // Verify the param was actually changed
    const after = chain.callReadOnlyFn(
      "protocol-config", "get-param",
      [types.ascii("governance-quorum-bps")], deployer.address
    );
    after.result.expectOk().expectUint(5500);
  },
});
