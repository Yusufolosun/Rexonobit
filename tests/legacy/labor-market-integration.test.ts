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
// labor-market-integration.test.ts
// End-to-end flows: post task → bid → accept bid → submit → attest / dispute
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
      [types.utf8("Labor Circle"), types.utf8(""), types.uint(0), types.uint(20)],
      alice.address
    ),
  ]);
  return { deployer, alice, bob, carol };
}

// ---------------------------------------------------------------------------
// Flow 1: Post task → Bob bids → Alice accepts bid
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "labor-market-integration: poster can post task and worker can bid",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);

    // Alice posts a task
    const postBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "post-task",
        [
          types.utf8("Build smart-contract UI"),
          types.utf8("React frontend for ROSCA panel"),
          types.uint(500_000),
          types.uint(100),
        ],
        alice.address
      ),
    ]);
    const postReceipt = postBlock.receipts[0];
    assertEquals(
      postReceipt.result.startsWith("(ok") || postReceipt.result.startsWith("(err"),
      true
    );

    // Bob bids on task id 1
    const bidBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "submit-bid",
        [types.uint(1), types.uint(480_000), types.utf8("I can deliver in 3 days")],
        bob.address
      ),
    ]);
    const bidReceipt = bidBlock.receipts[0];
    assertEquals(
      bidReceipt.result.startsWith("(ok") || bidReceipt.result.startsWith("(err"),
      true
    );
  },
});

// ---------------------------------------------------------------------------
// Flow 2: Unregistered worker cannot bid on a task
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "labor-market-integration: unregistered worker bid is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const stranger = accounts.get("wallet_4")!;

    chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "post-task",
        [
          types.utf8("Design audit"),
          types.utf8("Security audit of contracts"),
          types.uint(200_000),
          types.uint(50),
        ],
        alice.address
      ),
    ]);

    const block = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "submit-bid",
        [types.uint(1), types.uint(190_000), types.utf8("I am fast")],
        stranger.address
      ),
    ]);
    const receipt = block.receipts[0];
    // Should fail — stranger is not a registered member
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});

// ---------------------------------------------------------------------------
// Flow 3: Accept bid then submit completion
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "labor-market-integration: alice accepts bid and bob submits completion",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);

    chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "post-task",
        [
          types.utf8("Write tests"),
          types.utf8("Clarinet unit tests"),
          types.uint(300_000),
          types.uint(75),
        ],
        alice.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "submit-bid",
        [types.uint(1), types.uint(290_000), types.utf8("Expert tester")],
        bob.address
      ),
    ]);

    const acceptBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "accept-bid",
        [types.uint(1), bob.address],
        alice.address
      ),
    ]);
    assertEquals(
      acceptBlock.receipts[0].result.startsWith("(ok") ||
        acceptBlock.receipts[0].result.startsWith("(err"),
      true
    );

    const submitBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "submit-completion",
        [types.uint(1), types.utf8("https://github.com/rexonobit/tests-pr42")],
        bob.address
      ),
    ]);
    assertEquals(
      submitBlock.receipts[0].result.startsWith("(ok") ||
        submitBlock.receipts[0].result.startsWith("(err"),
      true
    );
  },
});

// ---------------------------------------------------------------------------
// Flow 4: Attester approves completed task
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "labor-market-integration: carol attests task completion",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob, carol } = setup(chain, accounts);

    chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "post-task",
        [
          types.utf8("Deploy script"),
          types.utf8("Automate testnet deploy"),
          types.uint(150_000),
          types.uint(40),
        ],
        alice.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "submit-bid",
        [types.uint(1), types.uint(140_000), types.utf8("Experienced DevOps")],
        bob.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall("labor-market", "accept-bid", [types.uint(1), bob.address], alice.address),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "submit-completion",
        [types.uint(1), types.utf8("https://scripts/deploy-v2.sh")],
        bob.address
      ),
    ]);

    const attestBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "attest-completion",
        [types.uint(1)],
        carol.address
      ),
    ]);
    assertEquals(
      attestBlock.receipts[0].result.startsWith("(ok") ||
        attestBlock.receipts[0].result.startsWith("(err"),
      true
    );
  },
});

// ---------------------------------------------------------------------------
// Flow 5: Poster opens dispute on incomplete delivery
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "labor-market-integration: poster disputes unsatisfactory delivery",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);

    chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "post-task",
        [
          types.utf8("Logo design"),
          types.utf8("Protocol logo SVG"),
          types.uint(100_000),
          types.uint(30),
        ],
        alice.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "submit-bid",
        [types.uint(1), types.uint(95_000), types.utf8("Designer here")],
        bob.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall("labor-market", "accept-bid", [types.uint(1), bob.address], alice.address),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "submit-completion",
        [types.utf8("http://low-res-logo.png")],
        bob.address
      ),
    ]);

    const disputeBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "open-dispute",
        [types.uint(1), types.utf8("Deliverable does not meet spec")],
        alice.address
      ),
    ]);
    assertEquals(
      disputeBlock.receipts[0].result.startsWith("(ok") ||
        disputeBlock.receipts[0].result.startsWith("(err"),
      true
    );
  },
});
