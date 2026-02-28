import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

// ---------------------------------------------------------------------------
// protocol-config.clar — unit tests
// ---------------------------------------------------------------------------

Clarinet.test({
  name: "initialize: sets default params and marks as initialized",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const block = chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    const paramResult = chain.callReadOnlyFn(
      "protocol-config",
      "get-param",
      [types.ascii("loan-interest-rate-bps")],
      deployer.address
    );
    paramResult.result.expectSome().expectUint(500);
  },
});

Clarinet.test({
  name: "initialize: cannot be called twice",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(101); // ERR-ALREADY-INITIALIZED
  },
});

Clarinet.test({
  name: "set-param: admin can update a parameter",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "protocol-config",
        "set-param",
        [types.ascii("loan-interest-rate-bps"), types.uint(750)],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    const paramResult = chain.callReadOnlyFn(
      "protocol-config",
      "get-param",
      [types.ascii("loan-interest-rate-bps")],
      deployer.address
    );
    paramResult.result.expectSome().expectUint(750);
  },
});

Clarinet.test({
  name: "set-param: non-admin cannot update parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const attacker = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "protocol-config",
        "set-param",
        [types.ascii("loan-interest-rate-bps"), types.uint(9999)],
        attacker.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(100); // ERR-NOT-ADMIN
  },
});

Clarinet.test({
  name: "emergency-pause: admin can pause and resume protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const pauseBlock = chain.mineBlock([
      Tx.contractCall("protocol-config", "emergency-pause", [], deployer.address),
    ]);
    pauseBlock.receipts[0].result.expectOk().expectBool(true);

    const resumeBlock = chain.mineBlock([
      Tx.contractCall("protocol-config", "resume-protocol", [], deployer.address),
    ]);
    resumeBlock.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "propose-admin / accept-admin: 2-step admin transfer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const newAdmin = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const proposeBlock = chain.mineBlock([
      Tx.contractCall(
        "protocol-config",
        "propose-admin",
        [types.principal(newAdmin.address)],
        deployer.address
      ),
    ]);
    proposeBlock.receipts[0].result.expectOk().expectBool(true);

    const acceptBlock = chain.mineBlock([
      Tx.contractCall("protocol-config", "accept-admin", [], newAdmin.address),
    ]);
    acceptBlock.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "initialize: double initialization is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "set-param: non-admin cannot change protocol parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const stranger = accounts.get("wallet_1")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("protocol-config", "set-min-deposit", [types.uint(500_000)], stranger.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "propose-admin: non-admin cannot propose new admin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const alice = accounts.get("wallet_1")!;
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("protocol-config", "propose-admin", [types.principal(bob.address)], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});
