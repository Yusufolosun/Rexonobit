import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// cooperative-registry.clar — unit tests
// ---------------------------------------------------------------------------

const ERR_NOT_MEMBER = 200;
const ERR_ALREADY_MEMBER = 201;
const ERR_CIRCLE_NOT_FOUND = 210;

Clarinet.test({
  name: "register-member: new principal can register",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    // Initialize config first
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "register-member: cannot register twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_ALREADY_MEMBER);
  },
});

Clarinet.test({
  name: "is-active-member: returns true after registration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);
    const result = chain.callReadOnlyFn(
      "cooperative-registry",
      "is-active-member",
      [types.principal(alice.address)],
      deployer.address
    );
    result.result.expectBool(true);
  },
});

Clarinet.test({
  name: "create-circle: registered member can create a circle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "create-circle",
        [
          types.utf8("Test Circle"),
          types.utf8("A test savings circle"),
          types.uint(100),
          types.uint(20),
        ],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
  },
});

Clarinet.test({
  name: "create-circle: unregistered caller is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "create-circle",
        [
          types.utf8("Rogue Circle"),
          types.utf8("Unauthorized"),
          types.uint(100),
          types.uint(20),
        ],
        bob.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_NOT_MEMBER);
  },
});

Clarinet.test({
  name: "request-join and vouch-for: join flow works",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
      Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    ]);
    // alice creates circle
    chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "create-circle",
        [types.utf8("Test"), types.utf8(""), types.uint(0), types.uint(20)],
        alice.address
      ),
    ]);
    // bob requests to join circle 1
    const joinBlock = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "request-join",
        [types.uint(1)],
        bob.address
      ),
    ]);
    joinBlock.receipts[0].result.expectOk().expectBool(true);

    // alice vouches for bob in circle 1
    const vouchBlock = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "vouch-for",
        [types.uint(1), types.principal(bob.address)],
        alice.address
      ),
    ]);
    vouchBlock.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "register-member: already-registered member gets rejected on re-register",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "create-circle: unregistered user cannot create a circle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const stranger = accounts.get("wallet_5")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("cooperative-registry", "create-circle", [types.utf8("Stranger Circle"), types.uint(10)], stranger.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "vouch-for: cannot vouch for address in circle they are not a member of",
  async fn(chain: Chain, accounts: Map<string, Account>) {
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
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "create-circle", [types.utf8("Alice's Circle"), types.uint(10)], alice.address),
    ]);
    // Charlie tries to vouch for bob in alice's circle without being a member
    const block = chain.mineBlock([
      Tx.contractCall("cooperative-registry", "vouch-for", [types.uint(1), types.principal(bob.address)], charlie.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "get-member: returns none for unregistered address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const stranger = accounts.get("wallet_5")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const result = chain.callReadOnlyFn(
      "cooperative-registry",
      "get-member",
      [types.principal(stranger.address)],
      deployer.address
    );
    result.result.expectNone();
  },
});

Clarinet.test({
  name: "expel-member: expelled member stays active globally",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
      Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    ]);
    // Alice creates an open circle; bob joins
    chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "create-circle",
        [types.utf8("Scope Test"), types.utf8(""), types.bool(true), types.uint(0)],
        alice.address
      ),
    ]);
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "request-join", [types.uint(1)], bob.address),
    ]);

    // Alice (admin, role u2) expels bob
    const expelBlock = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "expel-member",
        [types.uint(1), types.principal(bob.address)],
        alice.address
      ),
    ]);
    expelBlock.receipts[0].result.expectOk().expectBool(true);

    // Bob should no longer be a circle member …
    const circleCheck = chain.callReadOnlyFn(
      "cooperative-registry",
      "is-circle-member",
      [types.uint(1), types.principal(bob.address)],
      deployer.address
    );
    circleCheck.result.expectBool(false);

    // … but should still be globally active
    const activeCheck = chain.callReadOnlyFn(
      "cooperative-registry",
      "is-active-member",
      [types.principal(bob.address)],
      deployer.address
    );
    activeCheck.result.expectBool(true);
  },
});

// ---------------------------------------------------------------------------
// reinstate-member
// ---------------------------------------------------------------------------
Clarinet.test({
  name: "reinstate-member: admin can restore a suspended member to active",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);

    // Suspend Alice
    chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "suspend-member",
        [types.principal(alice.address)],
        deployer.address
      ),
    ]);

    // Confirm she is not active
    const suspendedCheck = chain.callReadOnlyFn(
      "cooperative-registry",
      "is-active-member",
      [types.principal(alice.address)],
      deployer.address
    );
    suspendedCheck.result.expectBool(false);

    // Reinstate her
    const reinstateBlock = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "reinstate-member",
        [types.principal(alice.address)],
        deployer.address
      ),
    ]);
    reinstateBlock.receipts[0].result.expectOk().expectBool(true);

    // Confirm she is active again
    const activeCheck = chain.callReadOnlyFn(
      "cooperative-registry",
      "is-active-member",
      [types.principal(alice.address)],
      deployer.address
    );
    activeCheck.result.expectBool(true);
  },
});

Clarinet.test({
  name: "reinstate-member: non-admin caller is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);
    chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "suspend-member",
        [types.principal(alice.address)],
        deployer.address
      ),
    ]);

    // Bob (not admin) tries to reinstate — should fail
    const block = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "reinstate-member",
        [types.principal(alice.address)],
        bob.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(100);
  },
});

Clarinet.test({
  name: "reinstate-member: cannot reinstate an active (non-suspended) member",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    ]);

    // Try to reinstate an already-active member
    const block = chain.mineBlock([
      Tx.contractCall(
        "cooperative-registry",
        "reinstate-member",
        [types.principal(alice.address)],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(116);
  },
});