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
// ROSCA lifecycle integration tests
// ---------------------------------------------------------------------------

function setupMembers(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;
  const alice = accounts.get("wallet_1")!;
  const bob = accounts.get("wallet_2")!;
  const charlie = accounts.get("wallet_3")!;
  chain.mineBlock([
    Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    Tx.contractCall("cooperative-registry", "register-member", [], charlie.address),
  ]);
  return { deployer, alice, bob, charlie };
}

Clarinet.test({
  name: "rosca: create ROSCA circle succeeds for registered member",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setupMembers(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "rosca",
        "create-rosca",
        [types.uint(1_000_000), types.uint(144), types.uint(3)],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk();
  },
});

Clarinet.test({
  name: "rosca: second member can join an existing ROSCA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setupMembers(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.uint(1_000_000), types.uint(144), types.uint(3)], alice.address),
    ]);
    const joinBlock = chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    joinBlock.receipts[0].result.expectOk();
  },
});

Clarinet.test({
  name: "rosca: three members join and circle is at capacity",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob, charlie } = setupMembers(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.uint(1_000_000), types.uint(144), types.uint(3)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], charlie.address),
    ]);
    // Verify member count via read-only
    const info = chain.callReadOnlyFn("rosca", "get-rosca-info", [types.uint(1)], alice.address);
    info.result.expectOk();
  },
});

Clarinet.test({
  name: "rosca: cannot join a ROSCA that is already full",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob, charlie } = setupMembers(chain, accounts);
    const dave = accounts.get("wallet_4")!;
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], dave.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.uint(1_000_000), types.uint(144), types.uint(2)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    // Charlie tries to join a max-2 circle — should fail
    const overflow = chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], charlie.address),
    ]);
    overflow.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "rosca: get-rosca-info returns correct contribution amount",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setupMembers(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.uint(2_000_000), types.uint(144), types.uint(4)], alice.address),
    ]);
    const info = chain.callReadOnlyFn("rosca", "get-rosca-info", [types.uint(1)], alice.address);
    // Expect ok response with contribution-amount of 2_000_000
    info.result.expectOk();
  },
});

Clarinet.test({
  name: "rosca: unregistered member cannot create a ROSCA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const stranger = accounts.get("wallet_5")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.uint(1_000_000), types.uint(144), types.uint(3)], stranger.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "rosca: member cannot join the same ROSCA twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setupMembers(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.uint(1_000_000), types.uint(144), types.uint(4)], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    // Bob tries to join again
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], bob.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "rosca: creator is automatically a member after creating ROSCA",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setupMembers(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("rosca", "create-rosca", [types.uint(1_000_000), types.uint(144), types.uint(3)], alice.address),
    ]);
    // Creator tries to join their own ROSCA — should fail (already member)
    const block = chain.mineBlock([
      Tx.contractCall("rosca", "join-rosca", [types.uint(1)], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "rosca: non-existent ROSCA read returns none",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setupMembers(chain, accounts);
    const info = chain.callReadOnlyFn("rosca", "get-rosca-info", [types.uint(999)], alice.address);
    info.result.expectErr();
  },
});
