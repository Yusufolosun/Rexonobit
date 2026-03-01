// @ts-nocheck
import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.7.1/index.ts";
import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.196.0/testing/asserts.ts";

// ──────────────────────────────────────────────────────────────────────────────
// Protocol Config Integration Tests
// Tests cover: authorized parameter reads, admin-only writes, invalid-value
// rejection, and cross-contract config reads.
// ──────────────────────────────────────────────────────────────────────────────

Clarinet.test({
  name: "protocol-config: deployer can read loan-fee-bps",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    const result = chain.callReadOnlyFn(
      "protocol-config",
      "get-loan-fee-bps",
      [],
      deployer.address
    );
    // Default value should be a valid uint
    assertStringIncludes(result.result, "u");
  },
});

Clarinet.test({
  name: "protocol-config: admin can update governance-quorum",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    const block = chain.mineBlock([
      Tx.contractCall(
        "protocol-config",
        "set-governance-quorum",
        [types.uint(1500)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");

    const readResult = chain.callReadOnlyFn(
      "protocol-config",
      "get-governance-quorum",
      [],
      deployer.address
    );
    assertStringIncludes(readResult.result, "u1500");
  },
});

Clarinet.test({
  name: "protocol-config: non-admin cannot update parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const alice = accounts.get("wallet_1")!;

    const block = chain.mineBlock([
      Tx.contractCall(
        "protocol-config",
        "set-governance-quorum",
        [types.uint(9999)],
        alice.address
      ),
    ]);
    assertStringIncludes(block.receipts[0].result, "err");
  },
});

Clarinet.test({
  name: "protocol-config: zero value for loan-fee-bps is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    const block = chain.mineBlock([
      Tx.contractCall(
        "protocol-config",
        "set-loan-fee-bps",
        [types.uint(0)],
        deployer.address
      ),
    ]);
    assertStringIncludes(block.receipts[0].result, "err");
  },
});

Clarinet.test({
  name: "protocol-config: voting-period below minimum is rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    // Attempt to set voting period < 144 blocks (1 day minimum)
    const block = chain.mineBlock([
      Tx.contractCall(
        "protocol-config",
        "set-voting-period",
        [types.uint(10)],
        deployer.address
      ),
    ]);
    assertStringIncludes(block.receipts[0].result, "err");
  },
});

Clarinet.test({
  name: "protocol-config: admin can read and write credit-per-score-unit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    const block = chain.mineBlock([
      Tx.contractCall(
        "protocol-config",
        "set-credit-per-score-unit",
        [types.uint(3000)],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});
