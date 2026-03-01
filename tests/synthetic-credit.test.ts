import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice    = accounts.get("wallet_1")!;
const bob      = accounts.get("wallet_2")!;

function setupWithTrustAndSavings() {
  simnet.callPublicFn("protocol-config", "initialize", [], deployer);
  simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
  simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Bob")], bob);
  simnet.callPublicFn("trust-score", "set-authorized-writer", [Cl.principal(deployer), Cl.bool(true)], deployer);
  simnet.callPublicFn("trust-score", "initialize-score", [Cl.principal(alice)], deployer);
  // Mine past default cooldown (144 blocks) so reward calls aren't blocked
  simnet.mineEmptyBlocks(145);
  // Seed score = 100; reward-savings +400 → 500; reward-loan-repay +300 → 800
  simnet.callPublicFn("trust-score", "reward-savings", [Cl.principal(alice), Cl.uint(400)], deployer);
  simnet.callPublicFn("trust-score", "reward-loan-repay", [Cl.principal(alice), Cl.uint(300)], deployer);
  simnet.callPublicFn("savings-vault", "initialize-vault", [], alice);
  simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(20_000_000)], alice);
  simnet.callPublicFn("savings-vault", "lock-savings", [Cl.uint(10_000_000), Cl.uint(5000)], alice);
}

describe("synthetic-credit", () => {
  describe("mint-scredit", () => {
    it("fails when trust < 700", () => {
      simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      const { result } = simnet.callPublicFn("synthetic-credit", "mint-scredit", [Cl.uint(1000)], alice);
      expect(result).toBeErr(Cl.uint(1102));
    });

    it("minting zero amount is rejected", () => {
      setupWithTrustAndSavings();
      const { result } = simnet.callPublicFn("synthetic-credit", "mint-scredit", [Cl.uint(0)], alice);
      expect(result).toBeErr(Cl.uint(1104));
    });

    it("succeeds with sufficient trust and locked savings", () => {
      setupWithTrustAndSavings();
      const { result } = simnet.callPublicFn("synthetic-credit", "mint-scredit", [Cl.uint(1000)], alice);
      expect(result).toBeOk(Cl.uint(1000));
    });
  });

  describe("burn-scredit", () => {
    it("member can burn their tokens", () => {
      setupWithTrustAndSavings();
      simnet.callPublicFn("synthetic-credit", "mint-scredit", [Cl.uint(1000)], alice);
      const { result } = simnet.callPublicFn("synthetic-credit", "burn-scredit", [Cl.uint(500)], alice);
      expect(result).toBeOk(Cl.bool(true));
    });

    it("burning more than balance is rejected", () => {
      setupWithTrustAndSavings();
      const { result } = simnet.callPublicFn("synthetic-credit", "burn-scredit", [Cl.uint(1_000_000)], alice);
      expect(result).toBeErr(Cl.uint(1108));
    });
  });

  describe("transfer-scredit", () => {
    it("member can transfer to another member", () => {
      setupWithTrustAndSavings();
      simnet.callPublicFn("synthetic-credit", "mint-scredit", [Cl.uint(2000)], alice);
      const { result } = simnet.callPublicFn("synthetic-credit", "transfer-scredit", [Cl.uint(500), Cl.principal(bob)], alice);
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("get-scredit-balance", () => {
    it("returns zero for fresh member", () => {
      simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      const result = simnet.callReadOnlyFn("synthetic-credit", "get-scredit-balance", [Cl.principal(alice)], deployer);
      expect(result.result).toBeOk(Cl.uint(0));
    });
  });
});
