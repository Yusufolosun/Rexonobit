import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// labor-market.clar — unit tests
// ---------------------------------------------------------------------------

const ERR_NOT_MEMBER = 700;
const ERR_TASK_NOT_FOUND = 710;
const ERR_WRONG_STATUS = 712;

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
  name: "post-task: registered member can post a task with bounty",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "post-task",
        [
          types.utf8("Build landing page"),
          types.utf8("Need a simple React landing page"),
          types.uint(5_000_000),
        ],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
  },
});

Clarinet.test({
  name: "post-task: unregistered caller is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const rogue = accounts.get("wallet_9")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "post-task",
        [types.utf8("Hack the market"), types.utf8(""), types.uint(0)],
        rogue.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_NOT_MEMBER);
  },
});

Clarinet.test({
  name: "bid-task: member can bid on an open task",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("labor-market", "post-task", [types.utf8("Task 1"), types.utf8(""), types.uint(5_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "bid-task",
        [types.uint(1), types.uint(4_500_000)],
        bob.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "accept-bid: poster can accept a worker bid",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("labor-market", "post-task", [types.utf8("Task 1"), types.utf8(""), types.uint(5_000_000)], alice.address),
      Tx.contractCall("labor-market", "bid-task", [types.uint(1), types.uint(4_500_000)], bob.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "labor-market",
        "accept-bid",
        [types.uint(1), types.principal(bob.address)],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "submit-completion: assigned worker can submit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("labor-market", "post-task", [types.utf8("Task 1"), types.utf8(""), types.uint(5_000_000)], alice.address),
      Tx.contractCall("labor-market", "bid-task", [types.uint(1), types.uint(4_500_000)], bob.address),
      Tx.contractCall("labor-market", "accept-bid", [types.uint(1), types.principal(bob.address)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("labor-market", "submit-completion", [types.uint(1)], bob.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "cancel-task: poster can cancel an open task",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("labor-market", "post-task", [types.utf8("Task to cancel"), types.utf8(""), types.uint(3_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("labor-market", "cancel-task", [types.uint(1)], alice.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "post-task: zero bounty is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall("labor-market", "post-task", [types.utf8("Zero bounty"), types.utf8(""), types.uint(0)], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "cancel-task: non-poster cannot cancel a task",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("labor-market", "post-task", [types.utf8("Alice's task"), types.utf8(""), types.uint(2_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("labor-market", "cancel-task", [types.uint(1)], bob.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "bid-task: cannot bid on non-existent task",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { bob } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall("labor-market", "bid-task", [types.uint(999), types.uint(1_000_000)], bob.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "approve-completion: non-poster cannot approve task completion",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    const charlie = accounts.get("wallet_3")!;
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], charlie.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("labor-market", "post-task", [types.utf8("A task"), types.utf8(""), types.uint(2_000_000)], alice.address),
      Tx.contractCall("labor-market", "bid-task", [types.uint(1), types.uint(1_800_000)], bob.address),
      Tx.contractCall("labor-market", "accept-bid", [types.uint(1), types.principal(bob.address)], alice.address),
      Tx.contractCall("labor-market", "submit-completion", [types.uint(1)], bob.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("labor-market", "approve-completion", [types.uint(1)], charlie.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});
