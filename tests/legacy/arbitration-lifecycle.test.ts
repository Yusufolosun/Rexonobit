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
// Arbitration / dispute resolution integration tests
// ---------------------------------------------------------------------------

function setupMembers(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;
  const alice = accounts.get("wallet_1")!;
  const bob = accounts.get("wallet_2")!;
  const charlie = accounts.get("wallet_3")!;
  const dave = accounts.get("wallet_4")!;
  const eve = accounts.get("wallet_5")!;
  chain.mineBlock([
    Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
    Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    Tx.contractCall("cooperative-registry", "register-member", [], charlie.address),
    Tx.contractCall("cooperative-registry", "register-member", [], dave.address),
    Tx.contractCall("cooperative-registry", "register-member", [], eve.address),
  ]);
  return { deployer, alice, bob, charlie, dave, eve };
}

Clarinet.test({
  name: "arbitration: registered member can open a dispute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setupMembers(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [
          types.principal(bob.address),
          types.uint(1),
          types.ascii("Bob failed to deliver the task on time"),
        ],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk();
  },
});

Clarinet.test({
  name: "arbitration: panelist can join an open dispute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob, charlie } = setupMembers(chain, accounts);
    chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [types.principal(bob.address), types.uint(1), types.ascii("Dispute reason")],
        alice.address
      ),
    ]);
    const joinBlock = chain.mineBlock([
      Tx.contractCall("arbitration", "join-panel", [types.uint(1)], charlie.address),
    ]);
    joinBlock.receipts[0].result.expectOk();
  },
});

Clarinet.test({
  name: "arbitration: three panelists join the same dispute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob, charlie, dave, eve } = setupMembers(chain, accounts);
    chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [types.principal(bob.address), types.uint(1), types.ascii("Breach of contract")],
        alice.address
      ),
    ]);
    const panelBlock = chain.mineBlock([
      Tx.contractCall("arbitration", "join-panel", [types.uint(1)], charlie.address),
      Tx.contractCall("arbitration", "join-panel", [types.uint(1)], dave.address),
      Tx.contractCall("arbitration", "join-panel", [types.uint(1)], eve.address),
    ]);
    for (const r of panelBlock.receipts) {
      r.result.expectOk();
    }
  },
});

Clarinet.test({
  name: "arbitration: dispute initiator cannot be a panelist in own dispute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setupMembers(chain, accounts);
    chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [types.principal(bob.address), types.uint(1), types.ascii("Fraud claim")],
        alice.address
      ),
    ]);
    // Alice (initiator) tries to join her own dispute panel — should fail
    const selfJoin = chain.mineBlock([
      Tx.contractCall("arbitration", "join-panel", [types.uint(1)], alice.address),
    ]);
    selfJoin.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "arbitration: get-dispute returns dispute info after opening",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice, bob } = setupMembers(chain, accounts);
    chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [types.principal(bob.address), types.uint(1), types.ascii("Late delivery")],
        alice.address
      ),
    ]);
    const info = chain.callReadOnlyFn("arbitration", "get-dispute", [types.uint(1)], alice.address);
    info.result.expectOk();
  },
});

Clarinet.test({
  name: "arbitration: respondent cannot open dispute against themselves",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setupMembers(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [types.principal(alice.address), types.uint(1), types.ascii("Self-dispute attempt")],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "arbitration: unregistered member cannot open a dispute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const stranger = accounts.get("wallet_5")!;
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
      Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "arbitration",
        "open-dispute",
        [types.principal(bob.address), types.uint(1), types.ascii("Attempt from stranger")],
        stranger.address
      ),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "arbitration: get-dispute on non-existent ID returns error",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setupMembers(chain, accounts);
    const info = chain.callReadOnlyFn("arbitration", "get-dispute", [types.uint(999)], alice.address);
    info.result.expectErr();
  },
});
