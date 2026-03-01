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
// Integration tests: governance vote → execute flow
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Flow 1: Governance propose → two votes → execute
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "governance-integration: propose param change, two members vote yes, execute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice, bob } = setup(chain, accounts);

    // Alice deposits so she has voting weight
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(5_000_000)], alice.address),
      Tx.contractCall("savings-vault", "deposit", [types.uint(5_000_000)], bob.address),
    ]);

    // Alice proposes a parameter change
    const proposeBlock = chain.mineBlock([
      Tx.contractCall(
        "governance",
        "propose",
        [
          types.ascii("PARAM-CHANGE"),
          types.ascii("Increase collateral factor to 0.8"),
          types.uint(100),
        ],
        alice.address
      ),
    ]);
    proposeBlock.receipts[0].result.expectOk();
    const proposalId = proposeBlock.receipts[0].result.expectOk().expectUint();

    // Both members vote yes
    const voteBlock = chain.mineBlock([
      Tx.contractCall("governance", "vote", [types.uint(proposalId), types.bool(true)], alice.address),
      Tx.contractCall("governance", "vote", [types.uint(proposalId), types.bool(true)], bob.address),
    ]);
    voteBlock.receipts[0].result.expectOk();
    voteBlock.receipts[1].result.expectOk();

    // Mine past voting period
    chain.mineEmptyBlockUntil(chain.blockHeight + 101);

    // Execute proposal
    const execBlock = chain.mineBlock([
      Tx.contractCall("governance", "execute", [types.uint(proposalId)], deployer.address),
    ]);
    execBlock.receipts[0].result.expectOk();
  },
});

// ---------------------------------------------------------------------------
// Flow 2: Governance veto prevents execution
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "governance-integration: vetoed proposal cannot be executed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice, bob } = setup(chain, accounts);

    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(3_000_000)], alice.address),
    ]);

    const proposeBlock = chain.mineBlock([
      Tx.contractCall(
        "governance",
        "propose",
        [
          types.ascii("POLICY-UPDATE"),
          types.ascii("Lower minimum trust score threshold"),
          types.uint(100),
        ],
        alice.address
      ),
    ]);
    proposeBlock.receipts[0].result.expectOk();
    const proposalId = proposeBlock.receipts[0].result.expectOk().expectUint();

    // Deployer vetoes
    const vetoBlock = chain.mineBlock([
      Tx.contractCall("governance", "veto", [types.uint(proposalId)], deployer.address),
    ]);
    vetoBlock.receipts[0].result.expectOk();

    // Attempt execute should fail
    chain.mineEmptyBlockUntil(chain.blockHeight + 101);
    const execBlock = chain.mineBlock([
      Tx.contractCall("governance", "execute", [types.uint(proposalId)], deployer.address),
    ]);
    execBlock.receipts[0].result.expectErr();
  },
});

// ---------------------------------------------------------------------------
// Flow 3: Duplicate vote is rejected
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "governance-integration: member cannot vote twice on same proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);

    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(2_000_000)], alice.address),
    ]);

    const proposeBlock = chain.mineBlock([
      Tx.contractCall(
        "governance",
        "propose",
        [
          types.ascii("PARAM-CHANGE"),
          types.ascii("Reduce base fee"),
          types.uint(100),
        ],
        alice.address
      ),
    ]);
    proposeBlock.receipts[0].result.expectOk();
    const proposalId = proposeBlock.receipts[0].result.expectOk().expectUint();

    // First vote
    chain.mineBlock([
      Tx.contractCall("governance", "vote", [types.uint(proposalId), types.bool(true)], alice.address),
    ]);

    // Second vote on same proposal should fail
    const dupVote = chain.mineBlock([
      Tx.contractCall("governance", "vote", [types.uint(proposalId), types.bool(false)], alice.address),
    ]);
    dupVote.receipts[0].result.expectErr();
  },
});
