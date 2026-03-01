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
// savings-vault.clar — unit tests
// ---------------------------------------------------------------------------

const ERR_NOT_MEMBER = 400;
const ERR_INSUFFICIENT_BALANCE = 403;
const ERR_STILL_LOCKED = 404;
const ERR_LOCK_SHORTENING = 210;

function setup(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;
  const alice = accounts.get("wallet_1")!;
  chain.mineBlock([
    Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    Tx.contractCall("cooperative-registry", "register-member", [], alice.address),
  ]);
  return { deployer, alice };
}

Clarinet.test({
  name: "deposit: registered member can deposit STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "savings-vault",
        "deposit",
        [types.uint(1_000_000)], // 1 STX
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "deposit: unregistered caller is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const rogue = accounts.get("wallet_9")!;
    chain.mineBlock([
      Tx.contractCall("protocol-config", "initialize", [], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "savings-vault",
        "deposit",
        [types.uint(1_000_000)],
        rogue.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_NOT_MEMBER);
  },
});

Clarinet.test({
  name: "lock-savings: member can lock with valid balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(5_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "savings-vault",
        "lock-savings",
        [types.uint(2_000_000), types.uint(2016)],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "withdraw: member can withdraw available balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(3_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("savings-vault", "withdraw", [], alice.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "withdraw-locked: fails before lock-until block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(5_000_000)], alice.address),
      Tx.contractCall("savings-vault", "lock-savings", [types.uint(2_000_000), types.uint(10000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("savings-vault", "withdraw-locked", [], alice.address),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_STILL_LOCKED);
  },
});

Clarinet.test({
  name: "get-vault-balance: returns zero for new member",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    const result = chain.callReadOnlyFn(
      "savings-vault",
      "get-vault-balance",
      [types.principal(alice.address)],
      deployer.address
    );
    result.result.expectUint(0);
  },
});

Clarinet.test({
  name: "deposit: zero amount is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(0)], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "withdraw: cannot withdraw more than deposited",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(1_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("savings-vault", "withdraw", [types.uint(5_000_000)], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "deposit: multiple sequential deposits accumulate balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(1_000_000)], alice.address),
      Tx.contractCall("savings-vault", "deposit", [types.uint(2_000_000)], alice.address),
    ]);
    const result = chain.callReadOnlyFn(
      "savings-vault",
      "get-vault-balance",
      [types.principal(alice.address)],
      deployer.address
    );
    result.result.expectUint(3_000_000);
  },
});

Clarinet.test({
  name: "lock-savings: cannot lock more than available balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("savings-vault", "deposit", [types.uint(1_000_000)], alice.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("savings-vault", "lock-savings", [types.uint(5_000_000), types.uint(1000)], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "lock-savings: rejects a shorter lock that would shorten an existing period",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    // First lock — 2016 blocks (≈ 14 days)
    const first = chain.mineBlock([
      Tx.contractCall(
        "savings-vault",
        "lock-savings",
        [types.uint(1_000_000), types.uint(2016)],
        alice.address
      ),
    ]);
    first.receipts[0].result.expectOk();

    // Second lock with a much shorter period — should fail
    const second = chain.mineBlock([
      Tx.contractCall(
        "savings-vault",
        "lock-savings",
        [types.uint(1_000_000), types.uint(144)],
        alice.address
      ),
    ]);
    second.receipts[0].result.expectErr().expectUint(ERR_LOCK_SHORTENING);
  },
});

Clarinet.test({
  name: "lock-savings: extending an existing lock period is allowed",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    // First lock — 500 blocks
    const first = chain.mineBlock([
      Tx.contractCall(
        "savings-vault",
        "lock-savings",
        [types.uint(1_000_000), types.uint(500)],
        alice.address
      ),
    ]);
    first.receipts[0].result.expectOk();

    // Second lock with a longer period — should succeed
    const second = chain.mineBlock([
      Tx.contractCall(
        "savings-vault",
        "lock-savings",
        [types.uint(1_000_000), types.uint(5000)],
        alice.address
      ),
    ]);
    second.receipts[0].result.expectOk();
  },
});