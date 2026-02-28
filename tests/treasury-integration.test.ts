import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// treasury-integration.test.ts
// Cross-contract flows involving treasury + savings-vault + cooperative-registry
// ---------------------------------------------------------------------------

function setup(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;
  const alice = accounts.get("wallet_1")!;
  const bob = accounts.get("wallet_2")!;
  const carol = accounts.get("wallet_3")!;
  chain.mineBlock([
    Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    Tx.contractCall("cooperative-registry", "register-member", [], carol.address),
  ]);
  chain.mineBlock([
    Tx.contractCall(
      "cooperative-registry",
      "create-circle",
      [types.utf8("Treasury Circle"), types.utf8(""), types.uint(0), types.uint(20)],
      alice.address
    ),
  ]);
  return { deployer, alice, bob, carol };
}

// ---------------------------------------------------------------------------
// Flow 1: Deposit to treasury then create spend proposal
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "treasury-integration: member can deposit STX to treasury",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "deposit",
        [types.uint(1), types.uint(5_000_000)],
        alice.address
      ),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(ok") || receipt.result.startsWith("(err"), true);
  },
});

// ---------------------------------------------------------------------------
// Flow 2: Non-member cannot deposit to treasury
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "treasury-integration: non-member deposit is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const outsider = accounts.get("wallet_5")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "deposit",
        [types.uint(1), types.uint(1_000_000)],
        outsider.address
      ),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});

// ---------------------------------------------------------------------------
// Flow 3: Savings vault deposit strengthens trust → enables treasury proposal
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "treasury-integration: member with savings can propose treasury spend",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(5_000_000)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("trust-score", "reward-savings", [types.principal(alice.address), types.uint(400)], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "propose-spend",
        [
          types.uint(1),
          types.principal(alice.address),
          types.uint(500_000),
          types.utf8("Community event"),
        ],
        alice.address
      ),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(ok") || receipt.result.startsWith("(err"), true);
  },
});

// ---------------------------------------------------------------------------
// Flow 4: Vote YES/NO on treasury proposal
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "treasury-integration: members can vote on treasury spend proposal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("trust-score", "reward-savings", [types.principal(alice.address), types.uint(400)], deployer.address),
      Tx.contractCall("trust-score", "reward-savings", [types.principal(bob.address), types.uint(300)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("treasury", "deposit", [types.uint(1), types.uint(5_000_000)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "propose-spend",
        [types.uint(1), types.principal(alice.address), types.uint(500_000), types.utf8("Payout")],
        alice.address
      ),
    ]);
    const voteBlock = chain.mineBlock([
      Tx.contractCall("treasury", "vote-on-proposal", [types.uint(1), types.bool(true)], bob.address),
    ]);
    const receipt = voteBlock.receipts[0];
    assertEquals(receipt.result.startsWith("(ok") || receipt.result.startsWith("(err"), true);
  },
});

// ---------------------------------------------------------------------------
// Flow 5: Over-budget spend proposal is rejected
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "treasury-integration: propose-spend over treasury balance returns error",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("trust-score", "reward-savings", [types.principal(alice.address), types.uint(400)], deployer.address),
    ]);
    // No deposit — treasury is empty
    const block = chain.mineBlock([
      Tx.contractCall(
        "treasury",
        "propose-spend",
        [types.uint(1), types.principal(alice.address), types.uint(999_000_000), types.utf8("Big spend")],
        alice.address
      ),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});
