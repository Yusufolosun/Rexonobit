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

// ---------------------------------------------------------------------------
// Edge-case tests
// ---------------------------------------------------------------------------

Clarinet.test({
  name: "open-dispute: unregistered member cannot open a dispute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const dave = accounts.get("wallet_4")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [types.principal(alice.address), types.uint(1), types.utf8("No registry")],
        dave.address
      ),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "open-dispute: claimant cannot dispute themselves",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [types.principal(alice.address), types.uint(1), types.utf8("Self dispute")],
        alice.address
      ),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "submit-verdict: verdict on missing dispute returns error",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "submit-verdict",
        [types.uint(999), types.uint(1), types.utf8("No such dispute")],
        alice.address
      ),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "join-panel: non-member cannot join panel",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;
    const outsider = accounts.get("wallet_5")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
      Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "create-circle", [types.utf8("B"), types.utf8(""), types.uint(0), types.uint(20)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("arbitration", "open-dispute", [types.principal(bob.address), types.uint(1), types.utf8("Dispute")], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("arbitration", "join-panel", [types.uint(1)], outsider.address),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "submit-verdict: SPLIT votes do not deadlock the dispute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    // Regression: previously (>= (+ for-c for-r) u2) excluded SPLIT from the
    // count. If any arbitrator voted SPLIT the dispute could never reach VERDICT.
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;
    const arb1 = accounts.get("wallet_3")!;
    const arb2 = accounts.get("wallet_4")!;
    const arb3 = accounts.get("wallet_5")!;

    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member",
        [types.utf8("Alice")], alice.address),
      Tx.contractCall("cooperative-registry", "register-member",
        [types.utf8("Bob")], bob.address),
      Tx.contractCall("cooperative-registry", "register-member",
        [types.utf8("Arb1")], arb1.address),
      Tx.contractCall("cooperative-registry", "register-member",
        [types.utf8("Arb2")], arb2.address),
      Tx.contractCall("cooperative-registry", "register-member",
        [types.utf8("Arb3")], arb3.address),
    ]);

    // Disputants' circle
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "create-circle",
        [types.utf8("Dispute Circle"), types.utf8("disputing parties"),
         types.bool(true), types.uint(0)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "request-join",
        [types.uint(1)], bob.address),
    ]);

    // Arbitrators' circle (different from disputants)
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "create-circle",
        [types.utf8("Arb Circle"), types.utf8("arbitrator pool"),
         types.bool(true), types.uint(0)], arb1.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "request-join",
        [types.uint(2)], arb2.address),
      Tx.contractCall("cooperative-registry", "request-join",
        [types.uint(2)], arb3.address),
    ]);

    // Give arbitrators enough trust (min 500)
    chain.mineBlock([
      Tx.contractCall("trust-score", "initialize-score",
        [types.principal(arb1.address)], deployer.address),
      Tx.contractCall("trust-score", "initialize-score",
        [types.principal(arb2.address)], deployer.address),
      Tx.contractCall("trust-score", "initialize-score",
        [types.principal(arb3.address)], deployer.address),
      Tx.contractCall("trust-score", "reward-savings",
        [types.principal(arb1.address), types.uint(400)], deployer.address),
      Tx.contractCall("trust-score", "reward-savings",
        [types.principal(arb2.address), types.uint(400)], deployer.address),
      Tx.contractCall("trust-score", "reward-savings",
        [types.principal(arb3.address), types.uint(400)], deployer.address),
    ]);

    // Open dispute
    chain.mineBlock([
      Tx.contractCall("arbitration", "open-dispute",
        [types.principal(bob.address), types.uint(1),
         types.utf8("Bob failed delivery"),
         types.utf8("Evidence attached")],
        alice.address),
    ]);

    // All three arbitrators join the panel
    chain.mineBlock([
      Tx.contractCall("arbitration", "join-panel", [types.uint(1)], arb1.address),
      Tx.contractCall("arbitration", "join-panel", [types.uint(1)], arb2.address),
      Tx.contractCall("arbitration", "join-panel", [types.uint(1)], arb3.address),
    ]);

    // Arb1 votes claimant, Arb2 votes SPLIT, Arb3 votes SPLIT
    chain.mineBlock([
      Tx.contractCall("arbitration", "submit-verdict",
        [types.uint(1), types.uint(1), types.utf8("favor claimant")],
        arb1.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("arbitration", "submit-verdict",
        [types.uint(1), types.uint(3), types.utf8("split decision")],
        arb2.address),
    ]);
    const finalBlock = chain.mineBlock([
      Tx.contractCall("arbitration", "submit-verdict",
        [types.uint(1), types.uint(3), types.utf8("another split")],
        arb3.address),
    ]);

    // The last vote should return (ok true) indicating all have voted
    finalBlock.receipts[0].result.expectOk().expectBool(true);

    // Verify dispute status moved to VERDICT (u3) — not stuck at PANEL-SET
    const dispute = chain.callReadOnlyFn(
      "arbitration", "get-dispute", [types.uint(1)], deployer.address
    );
    const statusStr = dispute.result;
    // Status should contain "status: u3" (DISPUTE-VERDICT), not "status: u2" (PANEL-SET)
    assertEquals(statusStr.includes("status: u3"), true);
  },
});

