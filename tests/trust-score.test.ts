import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice    = accounts.get("wallet_1")!;

function setupMemberWithTrust() {
  simnet.callPublicFn("protocol-config", "initialize", [], deployer);
  simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
  simnet.callPublicFn("trust-score", "set-authorized-writer", [Cl.principal(deployer), Cl.bool(true)], deployer);
  simnet.callPublicFn("trust-score", "initialize-score", [Cl.principal(alice)], deployer);
  // Mine past default cooldown (144 blocks) so first rewards are not blocked
  simnet.mineEmptyBlocks(145);
}

describe("trust-score", () => {
  describe("reward-savings", () => {
    it("authorized writer can reward trust score", () => {
      setupMemberWithTrust();
      const { result } = simnet.callPublicFn("trust-score", "reward-savings", [Cl.principal(alice), Cl.uint(25)], deployer);
      expect(result).toBeOk(Cl.uint(125)); // seed 100 + 25
    });

    it("score increases after reward", () => {
      setupMemberWithTrust();
      simnet.callPublicFn("trust-score", "reward-savings", [Cl.principal(alice), Cl.uint(25)], deployer);
      const result = simnet.callReadOnlyFn("trust-score", "get-score", [Cl.principal(alice)], deployer);
      expect(result.result).toBeOk(Cl.uint(125)); // seed 100 + 25
    });
  });

  describe("penalize", () => {
    it("does not go below 0", () => {
      setupMemberWithTrust();
      simnet.callPublicFn("trust-score", "reward-savings", [Cl.principal(alice), Cl.uint(10)], deployer);
      simnet.callPublicFn("trust-score", "penalize", [Cl.principal(alice), Cl.uint(9999), Cl.stringAscii("test")], deployer);
      const result = simnet.callReadOnlyFn("trust-score", "get-score", [Cl.principal(alice)], deployer);
      expect(result.result).toBeOk(Cl.uint(0));
    });
  });

  describe("cooldown enforcement", () => {
    it("second reward-loan-repay within cooldown is rejected", () => {
      setupMemberWithTrust();
      simnet.callPublicFn("trust-score", "reward-loan-repay", [Cl.principal(alice), Cl.uint(50)], deployer);
      const { result } = simnet.callPublicFn("trust-score", "reward-loan-repay", [Cl.principal(alice), Cl.uint(50)], deployer);
      expect(result).toBeErr(Cl.uint(303));
    });

    it("reward-loan-repay succeeds after cooldown elapses", () => {
      setupMemberWithTrust();
      simnet.callPublicFn("trust-score", "reward-loan-repay", [Cl.principal(alice), Cl.uint(50)], deployer);
      simnet.mineEmptyBlocks(150);
      const { result } = simnet.callPublicFn("trust-score", "reward-loan-repay", [Cl.principal(alice), Cl.uint(50)], deployer);
      expect(result).toBeOk(Cl.uint(200)); // seed 100 + 50 + 50
    });
  });
});
