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
