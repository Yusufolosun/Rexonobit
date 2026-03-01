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
// reputation-nft.clar — unit tests
// ---------------------------------------------------------------------------

const ERR_NOT_AUTHORIZED = 1100;
const ERR_TRANSFER_BLOCKED = 1102;
const ERR_BADGE_NOT_FOUND = 1103;

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
  name: "mint-badge: authorized minter can mint soulbound badge",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    const block = chain.mineBlock([
      Tx.contractCall(
        "reputation-nft",
        "mint-badge",
        [
          types.principal(alice.address),
          types.uint(1), // badge-type: first-loan-repaid
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectUint(1);
  },
});

Clarinet.test({
  name: "transfer: always reverts (soulbound)",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(alice.address), types.uint(1)], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall(
        "reputation-nft",
        "transfer",
        [types.uint(1), types.principal(alice.address), types.principal(bob.address)],
        alice.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_TRANSFER_BLOCKED);
  },
});

Clarinet.test({
  name: "burn-badge: authorized caller can burn a badge",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(alice.address), types.uint(2)], deployer.address),
    ]);
    const block = chain.mineBlock([
      Tx.contractCall("reputation-nft", "burn-badge", [types.uint(1)], deployer.address),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "get-owner: returns owner of minted badge",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(alice.address), types.uint(3)], deployer.address),
    ]);
    const result = chain.callReadOnlyFn(
      "reputation-nft",
      "get-owner",
      [types.uint(1)],
      deployer.address
    );
    result.result.expectOk().expectSome().expectPrincipal(alice.address);
  },
});

Clarinet.test({
  name: "get-last-token-id: increments correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    const bob = accounts.get("wallet_2")!;
    chain.mineBlock([
      Tx.contractCall("cooperative-registry", "register-member", [], bob.address),
    ]);
    chain.mineBlock([
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(alice.address), types.uint(1)], deployer.address),
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(bob.address), types.uint(2)], deployer.address),
    ]);
    const result = chain.callReadOnlyFn(
      "reputation-nft",
      "get-last-token-id",
      [],
      deployer.address
    );
    result.result.expectOk().expectUint(2);
  },
});

Clarinet.test({
  name: "mint-badge: non-deployer cannot mint a badge",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { alice } = setup(chain, accounts);
    const bob = accounts.get("wallet_2")!;
    const block = chain.mineBlock([
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(bob.address), types.uint(1)], alice.address),
    ]);
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "get-owner: returns owner after minting",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(alice.address), types.uint(1)], deployer.address),
    ]);
    const result = chain.callReadOnlyFn(
      "reputation-nft",
      "get-owner",
      [types.uint(1)],
      deployer.address
    );
    result.result.expectOk();
  },
});

Clarinet.test({
  name: "get-token-tier: returns correct tier for minted token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { deployer, alice } = setup(chain, accounts);
    chain.mineBlock([
      Tx.contractCall("reputation-nft", "mint-badge", [types.principal(alice.address), types.uint(3)], deployer.address),
    ]);
    const result = chain.callReadOnlyFn(
      "reputation-nft",
      "get-token-tier",
      [types.uint(1)],
      deployer.address
    );
    result.result.expectOk().expectUint(3);
  },
});
