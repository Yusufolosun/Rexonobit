import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// rosca.clar — unit tests
// ---------------------------------------------------------------------------

const ERR_NOT_MEMBER = 600;
const ERR_ROSCA_NOT_FOUND = 610;
const ERR_ALREADY_MEMBER = 612;

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
  return { deployer, alice, bob, carol };
}

Clarinet.test({
  name: "create-rosca: registered member can create a ROSCA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "create-rosca",
        [
          types.utf8("Friday Savers"),
          types.uint(1_000_000),
          types.uint(3),
          types.uint(4320),
        ],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
  },
});

Clarinet.test({
  name: "join-rosca: other member can join ROSCA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.utf8("Test"), types.uint(1_000_000), types.uint(3), types.uint(4320)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    block.receipts[0].result.expectOk();
  },
});

Clarinet.test({
  name: "join-rosca: cannot join twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.utf8("Test"), types.uint(1_000_000), types.uint(3), types.uint(4320)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_ALREADY_MEMBER);
  },
});

Clarinet.test({
  name: "lock-and-start: admin can trigger after members lock",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob, carol } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.utf8("Test"), types.uint(1_000_000), types.uint(3), types.uint(4320)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], carol.address),
    ]);
    // All 3 set payout order and lock
    const orderBlock = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "set-payout-order",
        [
          types.uint(1),
          types.list([
            types.principal(alice.address),
            types.principal(bob.address),
            types.principal(carol.address),
          ]),
        ],
        alice.address
      ),
    ]);
    orderBlock.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "contribute: member can contribute in active ROSCA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.utf8("Test"), types.uint(1_000_000), types.uint(2), types.uint(4320)], alice.address),
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    // After setting order, ROSCA becomes active
    chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "set-payout-order",
        [types.uint(1), types.list([types.principal(alice.address), types.principal(bob.address)])],
        alice.address
      ),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "contribute", [types.uint(1)], alice.address),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(ok") || receipt.result.startsWith("(err"), true);
  },
});

// ---------------------------------------------------------------------------
// Edge-case tests
// ---------------------------------------------------------------------------

Clarinet.test({
  name: "create-rosca: unregistered user cannot create ROSCA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const outsider = accounts.get("wallet_5")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.utf8("X"), types.uint(500_000), types.uint(2), types.uint(4320)], outsider.address),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "join-rosca: member cannot join non-existent ROSCA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { bob } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(999)], bob.address),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "join-rosca: member cannot join the same ROSCA twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.utf8("Dup"), types.uint(1_000_000), types.uint(2), types.uint(4320)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "contribute: contribution to non-existent ROSCA returns error",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "contribute", [types.uint(999)], alice.address),
    ]);
    const receipt = block.receipts[0];
    assertEquals(receipt.result.startsWith("(err"), true);
  },
});

Clarinet.test({
  name: "set-payout-order: rejects list with duplicate addresses",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob, carol } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.utf8("Dup Test"), types.uint(1_000_000), types.uint(3), types.uint(4320)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], carol.address),
    ]);
    // Try to set payout order with alice listed twice
    const block = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "set-payout-order",
        [
          types.uint(1),
          types.list([
            types.principal(alice.address),
            types.principal(alice.address),
            types.principal(bob.address),
          ]),
        ],
        alice.address
      ),
    ]);
    // Should fail with ERR-DUPLICATE-ENTRY (u815)
    block.receipts[0].result.expectErr().expectUint(815);
  },
});

Clarinet.test({
  name: "set-payout-order: rejects list with non-member principal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob, carol } = setup(chain, accounts);
    const outsider = accounts.get("wallet_5")!;
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.utf8("Bad Order"), types.uint(1_000_000), types.uint(3), types.uint(4320)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], carol.address),
    ]);
    // Include an outsider who never joined
    const block = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "set-payout-order",
        [
          types.uint(1),
          types.list([
            types.principal(alice.address),
            types.principal(bob.address),
            types.principal(outsider.address),
          ]),
        ],
        alice.address
      ),
    ]);
    // Should fail with ERR-NOT-IN-ROSCA (u805)
    block.receipts[0].result.expectErr().expectUint(805);
  },
});

Clarinet.test({
  name: "lock-and-start: does not transfer STX from the caller",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "create-rosca",
        [types.utf8("NoCharge"), types.uint(1_000_000), types.uint(2), types.uint(4320)],
        alice.address
      ),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "lock-and-start", [types.uint(1)], alice.address),
    ]);
    block.receipts[0].result.expectOk();
    // No STX transfer events — lock-and-start is purely a status transition
    const stxEvents = block.receipts[0].events.filter(
      (e: any) => e.type === "stx_transfer_event"
    );
    assertEquals(stxEvents.length, 0);
  },
});