import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice    = accounts.get("wallet_1")!;
const bob      = accounts.get("wallet_2")!;

function setupWithCircle() {
  simnet.callPublicFn("protocol-config", "initialize", [], deployer);
  simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
  simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Bob")], bob);
  // Open circle: request-join auto-admits
  simnet.callPublicFn("cooperative-registry", "create-circle", [
    Cl.stringUtf8("Lending Circle"),
    Cl.stringUtf8("For lending tests"),
    Cl.bool(true),
    Cl.uint(0)
  ], alice);
  simnet.callPublicFn("cooperative-registry", "request-join", [Cl.uint(1)], bob);
  // Trust score setup (needed because request-loan unwraps get-score)
  simnet.callPublicFn("trust-score", "set-authorized-writer", [Cl.principal(deployer), Cl.bool(true)], deployer);
  simnet.callPublicFn("trust-score", "initialize-score", [Cl.principal(bob)], deployer);
}

describe("lending-pool", () => {
  describe("fund-pool", () => {
    it("member can fund a circle lending pool", () => {
      setupWithCircle();
      const { result } = simnet.callPublicFn("lending-pool", "fund-pool", [Cl.uint(1), Cl.uint(10_000_000)], alice);
      expect(result).toBeOk(Cl.uint(10_000_000)); // returns (ok new-pool-balance)
    });
  });

  describe("get-pool-balance", () => {
    it("returns funded amount", () => {
      setupWithCircle();
      simnet.callPublicFn("lending-pool", "fund-pool", [Cl.uint(1), Cl.uint(5_000_000)], alice);
      const result = simnet.callReadOnlyFn("lending-pool", "get-pool-balance", [Cl.uint(1)], deployer);
      expect(result.result).toBeOk(Cl.uint(5_000_000));
    });
  });

  describe("request-loan", () => {
    it("zero-amount loan is rejected", () => {
      setupWithCircle();
      simnet.callPublicFn("lending-pool", "fund-pool", [Cl.uint(1), Cl.uint(10_000_000)], alice);
      const { result } = simnet.callPublicFn("lending-pool", "request-loan", [Cl.uint(1), Cl.uint(0)], bob);
      expect(result).toBeErr(Cl.uint(413));
    });
  });

  describe("get-max-loan-amount", () => {
    it("returns score * multiplier matching request-loan formula", () => {
      setupWithCircle();
      // Bob has trust score = 100 (seed), default multiplier = 5
      // So max loan = 100 * 5 = 500
      const result = simnet.callReadOnlyFn("lending-pool", "get-max-loan-amount", [Cl.principal(bob)], deployer);
      expect(result.result).toBeOk(Cl.uint(500));
    });

    it("max loan increases when trust score increases", () => {
      setupWithCircle();
      simnet.mineEmptyBlocks(145);
      simnet.callPublicFn("trust-score", "reward-savings", [Cl.principal(bob), Cl.uint(100)], deployer);
      // Bob now has score = 200, multiplier = 5, so max = 1000
      const result = simnet.callReadOnlyFn("lending-pool", "get-max-loan-amount", [Cl.principal(bob)], deployer);
      expect(result.result).toBeOk(Cl.uint(1000));
    });
  });
});
