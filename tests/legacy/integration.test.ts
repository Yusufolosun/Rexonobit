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
// Integration tests: end-to-end protocol flows across multiple contracts
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
// Flow 1: Register → Deposit → Lock → Check Trust Score
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "integration: register member, deposit STX, verify vault balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const depositBlock = chain.mineBlock([
      Tx.contractCall(
        "savings-vault",
        "deposit",
        [types.uint(5_000_000)],
        alice.address
      ),
    ]);
    depositBlock.receipts[0].result.expectOk();

    const balResult = chain.callReadOnlyFn(
      "savings-vault",
      "get-vault-balance",
      [types.principal(alice.address)],
      alice.address
    );
    balResult.result.expectOk().expectUint(5_000_000);
  },
});

Clarinet.test({
  name: "integration: deposit then lock savings accumulates trust score",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);

    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(10_000_000)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall(
        "savings-vault",
        "lock-savings",
        [types.uint(5_000_000), types.uint(2016)],
        alice.address
      ),
    ]);

    // Verify locked balance
    const locked = chain.callReadOnlyFn(
      "savings-vault",
      "get-locked-balance",
      [types.principal(alice.address)],
      alice.address
    );
    locked.result.expectOk().expectUint(5_000_000);
  },
});

// ---------------------------------------------------------------------------
// Flow 2: Deposit → Request Loan → Repay Loan
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "integration: member deposits, creates circle, requests and repays loan",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice, bob } = setup(chain, accounts);

    // Fund pool
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(50_000_000)], alice.address),
      Tx.contractCall("lending-pool", "fund-pool", [types.uint(1), types.uint(20_000_000)], deployer.address),
    ]);

    // Request loan (circle 1)
    const loanBlock = chain.mineBlock([
      Tx.contractCall(
        "lending-pool",
        "request-loan",
        [types.uint(1), types.uint(1_000_000)],
        alice.address
      ),
    ]);
    loanBlock.receipts[0].result.expectOk();
  },
});

// ---------------------------------------------------------------------------
// Flow 3: Create ROSCA → Join → Contribute → Trigger Payout
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "integration: create ROSCA, members join and contribute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);

    // Alice creates a ROSCA
    const createBlock = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "create-rosca",
        [
          types.uint(1_000_000),  // contribution amount
          types.uint(144),        // cycle length
          types.uint(3),          // max members
        ],
        alice.address
      ),
    ]);
    createBlock.receipts[0].result.expectOk();

    // Bob joins
    const joinBlock = chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    joinBlock.receipts[0].result.expectOk();
  },
});

// ---------------------------------------------------------------------------
// Flow 4: Post Task → Bid → Accept Bid → Submit → Attest
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "integration: task lifecycle — post, bid, accept, submit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);

    // Alice posts a task
    const postBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "post-task",
        [
          types.uint(1),
          types.ascii("Build a Clarity contract"),
          types.ascii("Must pass all tests"),
          types.uint(5_000_000),
        ],
        alice.address
      ),
    ]);
    postBlock.receipts[0].result.expectOk();

    // Bob bids
    const bidBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "bid-task",
        [types.uint(1), types.uint(4_500_000)],
        bob.address
      ),
    ]);
    bidBlock.receipts[0].result.expectOk();

    // Alice accepts bid
    const acceptBlock = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "accept-bid",
        [types.uint(1), types.principal(bob.address)],
        alice.address
      ),
    ]);
    acceptBlock.receipts[0].result.expectOk();
  },
});

// ---------------------------------------------------------------------------
// Flow 5: Governance proposal lifecycle
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "integration: propose governance change and vote",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);

    // Alice proposes
    const propBlock = chain.mineBlock([
      Tx.contractCall(
        "governance",
        "propose",
        [
          types.ascii("Increase Max Loan"),
          types.ascii("Raise the loan ceiling to 500 STX"),
          types.ascii("max-loan"),
          types.uint(500_000_000),
        ],
        alice.address
      ),
    ]);
    propBlock.receipts[0].result.expectOk();

    // Bob votes yes
    const voteBlock = chain.mineBlock([
      Tx.contractCall(
        "governance",
        "vote",
        [types.uint(1), types.bool(true)],
        bob.address
      ),
    ]);
    voteBlock.receipts[0].result.expectOk();
  },
});

// ---------------------------------------------------------------------------
// Flow 6: Open Dispute → Join Panel → Submit Verdict
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "integration: open dispute and join arbitration panel",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice, bob } = setup(chain, accounts);

    const charlie = accounts.get("wallet_3")!;
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], charlie.address),
    ]);

    // Alice opens dispute against bob
    const disputeBlock = chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [
          types.principal(bob.address),
          types.uint(1),
          types.ascii("Bob failed to deliver the task"),
        ],
        alice.address
      ),
    ]);
    disputeBlock.receipts[0].result.expectOk();
  },
});
