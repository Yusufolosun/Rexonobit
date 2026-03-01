import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice    = accounts.get("wallet_1")!;
const stranger = accounts.get("wallet_9")!;

function setup() {
  simnet.callPublicFn("protocol-config", "initialize", [], deployer);
  simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
  simnet.callPublicFn("savings-vault", "initialize-vault", [], alice);
}

describe("savings-vault", () => {
  describe("initialize-vault", () => {
    it("unregistered caller is rejected", () => {
      simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      const { result } = simnet.callPublicFn("savings-vault", "initialize-vault", [], stranger);
      expect(result).toBeErr(Cl.uint(201));
    });
  });

  describe("deposit", () => {
    it("registered member can deposit STX", () => {
      setup();
      const { result } = simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(1_000_000)], alice);
      expect(result).toBeOk(Cl.uint(1_000_000)); // returns (ok new-balance)
    });

    it("deposit without vault init fails", () => {
      simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      const { result } = simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(1_000_000)], alice);
      expect(result).toBeErr(Cl.uint(202));
    });

    it("zero amount is rejected", () => {
      setup();
      const { result } = simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(0)], alice);
      expect(result).toBeErr(Cl.uint(206));
    });

    it("multiple deposits accumulate", () => {
      setup();
      simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(1_000_000)], alice);
      simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(2_000_000)], alice);
      const balance = simnet.callReadOnlyFn("savings-vault", "get-vault-balance", [Cl.principal(alice)], deployer);
      expect(balance.result).toBeOk(Cl.uint(3_000_000));
    });
  });

  describe("lock-savings", () => {
    it("member can lock with valid balance", () => {
      setup();
      simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(5_000_000)], alice);
      const { result } = simnet.callPublicFn("savings-vault", "lock-savings", [Cl.uint(2_000_000), Cl.uint(2016)], alice);
      // Returns (ok unlock-at); verify success by checking locked balance
      const locked = simnet.callReadOnlyFn("savings-vault", "get-locked-balance", [Cl.principal(alice)], deployer);
      expect(locked.result).toBeOk(Cl.uint(2_000_000));
    });

    it("cannot lock for too short a duration", () => {
      setup();
      const { result } = simnet.callPublicFn("savings-vault", "lock-savings", [Cl.uint(2_000_000), Cl.uint(10)], alice);
      expect(result).toBeErr(Cl.uint(205)); // ERR-LOCK-TOO-SHORT
    });
  });

  describe("withdraw", () => {
    it("member can withdraw available balance", () => {
      setup();
      simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(3_000_000)], alice);
      const { result } = simnet.callPublicFn("savings-vault", "withdraw", [Cl.uint(1_000_000)], alice);
      expect(result).toBeOk(Cl.uint(2_000_000)); // returns (ok remaining-balance)
    });

    it("cannot withdraw more than deposited", () => {
      setup();
      simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(1_000_000)], alice);
      const { result } = simnet.callPublicFn("savings-vault", "withdraw", [Cl.uint(5_000_000)], alice);
      expect(result).toBeErr(Cl.uint(203));
    });
  });

  describe("withdraw-locked", () => {
    it("fails before lock-until block", () => {
      setup();
      simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(5_000_000)], alice);
      simnet.callPublicFn("savings-vault", "lock-savings", [Cl.uint(2_000_000), Cl.uint(10000)], alice);
      const { result } = simnet.callPublicFn("savings-vault", "withdraw-locked", [Cl.uint(1_000_000)], alice);
      expect(result).toBeErr(Cl.uint(204));
    });
  });

  describe("get-vault-balance", () => {
    it("returns zero for member with empty vault", () => {
      setup();
      const result = simnet.callReadOnlyFn("savings-vault", "get-vault-balance", [Cl.principal(alice)], deployer);
      expect(result.result).toBeOk(Cl.uint(0));
    });
  });
});
