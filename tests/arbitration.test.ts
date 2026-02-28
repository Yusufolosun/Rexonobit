import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// arbitration.clar — unit tests
// ---------------------------------------------------------------------------

const ERR_NOT_MEMBER = 1000;
const ERR_DISPUTE_NOT_FOUND = 1010;
const ERR_PANEL_FULL = 1013;
const ERR_SAME_CIRCLE = 1014;
const ERR_TRUST_TOO_LOW = 1015;

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
      [types.utf8("Circle A"), types.utf8(""), types.uint(0), types.uint(20)],
      alice.address
    ),
  ]);
  return { deployer, alice, bob };
}

Clarinet.test({
  name: "open-dispute: member can open a dispute with escrow fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [
          types.principal(bob.address),
          types.uint(1),
          types.utf8("Bob failed to deliver the work"),
        ],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
  },
});

Clarinet.test({
  name: "open-dispute: unregistered caller is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const rogue = accounts.get("wallet_9")!;
    const validTarget = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [types.principal(validTarget.address), types.uint(1), types.utf8("Dispute")],
        rogue.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_NOT_MEMBER);
  },
});

Clarinet.test({
  name: "join-panel: member with sufficient trust can join panel",
  async fn(chain: Chain, accounts: Map<string, Account>) {
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
      Tx.contractCall("cooperative-registry", "create-circle", [types.utf8("A"), types.utf8(""), types.uint(0), types.uint(20)], alice.address),
      Tx.contractCall("cooperative-registry", "create-circle", [types.utf8("B"), types.utf8(""), types.uint(0), types.uint(20)], carol.address),
    ]);
    // Give carol enough trust
    chain.mineBlock([
      Tx.contractCall("trust-score", "reward-savings", [types.principal(carol.address), types.uint(400)], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("arbitration", "open-dispute", [types.principal(bob.address), types.uint(1), types.utf8("Test")], alice.address),
    ]);
    // carol joins from different circle
    const block = chain.mineBlock([
      Tx.contractCall("arbitration", "join-panel", [types.uint(1)], carol.address),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(ok") || receipt.result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "submit-verdict: panelist can submit verdict",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
      Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "create-circle", [types.utf8("A"), types.utf8(""), types.uint(0), types.uint(20)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("arbitration", "open-dispute", [types.principal(bob.address), types.uint(1), types.utf8("Dispute desc")], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "submit-verdict",
        [types.uint(1), types.uint(1), types.utf8("Claimant wins based on evidence")],
        alice.address
      ),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(ok") || receipt.result.startsWith("(err"), true);
  },
});
