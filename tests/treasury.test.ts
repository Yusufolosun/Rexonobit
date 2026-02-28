import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// treasury.clar — unit tests
// ---------------------------------------------------------------------------

const ERR_NOT_MEMBER = 800;
const ERR_NOT_CIRCLE_MEMBER = 802;
const ERR_PROPOSAL_NOT_FOUND = 810;
const ERR_BELOW_SUPERMAJORITY = 815;

function setup(chain: Chain, accounts: Map<string, Account>) {
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
      [types.utf8("Treasury Circle"), types.utf8(""), types.uint(0), types.uint(20)],
      alice.address
    ),
  ]);
  return { deployer, alice, bob };
}

Clarinet.test({
  name: "deposit-to-treasury: circle member can deposit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "deposit-to-treasury",
        [types.uint(1), types.uint(10_000_000)],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "get-treasury-balance: returns correct balance after deposit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-to-treasury", [types.uint(1), types.uint(5_000_000)], alice.address),
    ]);
    const result = chain.callReadOnlyFn(
      "treasury",
      "get-treasury-balance",
      [types.uint(1)],
      deployer.address
    );
    result.result.expectUint(5_000_000);
  },
});

Clarinet.test({
  name: "propose-spend: circle member can create a spend proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-to-treasury", [types.uint(1), types.uint(10_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "propose-spend",
        [
          types.uint(1),
          types.principal(bob.address),
          types.uint(2_000_000),
          types.utf8("Community event"),
        ],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
  },
});

Clarinet.test({
  name: "vote: member can vote yes on a proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-to-treasury", [types.uint(1), types.uint(10_000_000)], alice.address),
      Tx.contractCall("treasury", "propose-spend", [types.uint(1), types.principal(bob.address), types.uint(2_000_000), types.utf8("Event")], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("treasury", "vote", [types.uint(1), types.bool(true)], alice.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "execute-spend: fails below supermajority",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-to-treasury", [types.uint(1), types.uint(10_000_000)], alice.address),
      Tx.contractCall("treasury", "propose-spend", [types.uint(1), types.principal(bob.address), types.uint(2_000_000), types.utf8("Event")], alice.address),
    ]);
    // Only 1 vote, not supermajority
    chain.mineBlock([
      Tx.contractCall("treasury", "vote", [types.uint(1), types.bool(true)], alice.address),
    ]);
    // fast-forward past timelock
    chain.mineEmptyBlockUntil(chain.blockHeight + 200);
    const block = chain.mineBlock([
      Tx.contractCall("treasury", "execute-spend", [types.uint(1)], alice.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_BELOW_SUPERMAJORITY);
  },
});

Clarinet.test({
  name: "propose-spend: amount exceeding treasury balance is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-to-treasury", [types.uint(1), types.uint(1_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("treasury", "propose-spend", [types.uint(1), types.principal(bob.address), types.uint(100_000_000), types.utf8("Over budget")], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "vote: duplicate vote on same proposal is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("treasury", "deposit-to-treasury", [types.uint(1), types.uint(5_000_000)], alice.address),
      Tx.contractCall("treasury", "propose-spend", [types.uint(1), types.principal(bob.address), types.uint(1_000_000), types.utf8("Duplicate vote")], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("treasury", "vote", [types.uint(1), types.bool(true)], bob.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("treasury", "vote", [types.uint(1), types.bool(true)], bob.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "propose-spend: non-member cannot propose a spend",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const stranger = accounts.get("wallet_5")!;
    const recipient = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("treasury", "propose-spend", [types.uint(1), types.principal(recipient.address), types.uint(1_000_000), types.utf8("Stranger spend")], stranger.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});
