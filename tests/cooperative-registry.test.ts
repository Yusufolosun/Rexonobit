import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice    = accounts.get("wallet_1")!;
const bob      = accounts.get("wallet_2")!;
const charlie  = accounts.get("wallet_3")!;

function initProtocol() {
  simnet.callPublicFn("protocol-config", "initialize", [], deployer);
}

describe("cooperative-registry", () => {
  describe("register-member", () => {
    it("new principal can register", () => {
      initProtocol();
      const { result } = simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      expect(result).toBeOk(Cl.bool(true));
    });

    it("cannot register twice", () => {
      initProtocol();
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      const { result } = simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      expect(result).toBeErr(Cl.uint(101));
    });
  });

  describe("is-active-member", () => {
    it("returns true after registration", () => {
      initProtocol();
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      const result = simnet.callReadOnlyFn("cooperative-registry", "is-active-member", [Cl.principal(alice)], deployer);
      expect(result.result).toBeBool(true);
    });

    it("returns false for unregistered address", () => {
      initProtocol();
      const result = simnet.callReadOnlyFn("cooperative-registry", "is-active-member", [Cl.principal(charlie)], deployer);
      expect(result.result).toBeBool(false);
    });
  });

  describe("create-circle", () => {
    it("registered member can create a circle", () => {
      initProtocol();
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      const { result } = simnet.callPublicFn("cooperative-registry", "create-circle", [
        Cl.stringUtf8("Savings Circle A"),
        Cl.stringUtf8("A community savings circle"),
        Cl.bool(true),
        Cl.uint(1000000)
      ], alice);
      expect(result).toBeOk(Cl.uint(1));
    });

    it("unregistered caller is rejected", () => {
      initProtocol();
      const { result } = simnet.callPublicFn("cooperative-registry", "create-circle", [
        Cl.stringUtf8("Bad Circle"),
        Cl.stringUtf8("Should not work"),
        Cl.bool(true),
        Cl.uint(0)
      ], charlie);
      expect(result).toBeErr(Cl.uint(102));
    });
  });

  describe("request-join and vouch-for", () => {
    it("open circle auto-joins on request", () => {
      initProtocol();
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Bob")], bob);
      simnet.callPublicFn("cooperative-registry", "create-circle", [
        Cl.stringUtf8("Open Circle"),
        Cl.stringUtf8("An open circle"),
        Cl.bool(true),
        Cl.uint(0)
      ], alice);
      const joinResult = simnet.callPublicFn("cooperative-registry", "request-join", [Cl.uint(1)], bob);
      expect(joinResult.result).toBeOk(Cl.bool(true));
    });

    it("closed circle vouch flow works correctly", () => {
      initProtocol();
      // Lower endorsement requirement so 1 vouch suffices
      simnet.callPublicFn("protocol-config", "set-param",
        [Cl.stringAscii("endorsement-required-count"), Cl.uint(1)], deployer);
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Bob")], bob);
      simnet.callPublicFn("cooperative-registry", "create-circle", [
        Cl.stringUtf8("Private Circle"),
        Cl.stringUtf8("A private circle"),
        Cl.bool(false),
        Cl.uint(0)
      ], alice);
      const joinResult = simnet.callPublicFn("cooperative-registry", "request-join", [Cl.uint(1)], bob);
      expect(joinResult.result).toBeOk(Cl.bool(false)); // Pending, not yet joined
      const vouchResult = simnet.callPublicFn("cooperative-registry", "vouch-for",
        [Cl.uint(1), Cl.principal(bob)], alice);
      expect(vouchResult.result).toBeOk(Cl.bool(true)); // Threshold reached, Bob joined
    });
  });

  describe("get-member", () => {
    it("returns none for unregistered address", () => {
      initProtocol();
      const result = simnet.callReadOnlyFn("cooperative-registry", "get-member", [Cl.principal(charlie)], deployer);
      expect(result.result).toBeNone();
    });
  });

  describe("suspend and reinstate member", () => {
    it("admin can suspend and reinstate a member", () => {
      initProtocol();
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      const suspendResult = simnet.callPublicFn("cooperative-registry", "suspend-member", [Cl.principal(alice)], deployer);
      expect(suspendResult.result).toBeOk(Cl.bool(true));
      const afterSuspend = simnet.callReadOnlyFn("cooperative-registry", "is-active-member", [Cl.principal(alice)], deployer);
      expect(afterSuspend.result).toBeBool(false);
      const reinstateResult = simnet.callPublicFn("cooperative-registry", "reinstate-member", [Cl.principal(alice)], deployer);
      expect(reinstateResult.result).toBeOk(Cl.bool(true));
      const afterReinstate = simnet.callReadOnlyFn("cooperative-registry", "is-active-member", [Cl.principal(alice)], deployer);
      expect(afterReinstate.result).toBeBool(true);
    });

    it("non-admin cannot reinstate a member", () => {
      initProtocol();
      simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
      simnet.callPublicFn("cooperative-registry", "suspend-member", [Cl.principal(alice)], deployer);
      const { result } = simnet.callPublicFn("cooperative-registry", "reinstate-member", [Cl.principal(alice)], bob);
      expect(result).toBeErr(Cl.uint(100));
    });
  });
});
