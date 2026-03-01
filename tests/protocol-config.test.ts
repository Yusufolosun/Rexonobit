import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

// ---------------------------------------------------------------------------
// protocol-config.clar -- unit tests (Clarinet SDK v3 / vitest)
// ---------------------------------------------------------------------------

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1  = accounts.get("wallet_1")!;
const wallet2  = accounts.get("wallet_2")!;

describe("protocol-config", () => {
  describe("initialize", () => {
    it("sets default params and marks as initialized", () => {
      const { result } = simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      expect(result).toBeOk(Cl.bool(true));
    });

    it("cannot be called twice", () => {
      simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      const { result } = simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      expect(result).toBeErr(Cl.uint(1004));
    });
  });

  describe("set-param", () => {
    it("admin can update a parameter", () => {
      simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      const { result } = simnet.callPublicFn(
        "protocol-config", "set-param",
        [Cl.stringAscii("loan-fee-bps"), Cl.uint(750)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      const param = simnet.callReadOnlyFn(
        "protocol-config", "get-param",
        [Cl.stringAscii("loan-fee-bps")],
        deployer
      );
      expect(param.result).toBeOk(Cl.uint(750));
    });

    it("non-admin cannot update parameters", () => {
      simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      const { result } = simnet.callPublicFn(
        "protocol-config", "set-param",
        [Cl.stringAscii("loan-fee-bps"), Cl.uint(9999)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(1000));
    });
  });

  describe("emergency-pause", () => {
    it("admin can pause and resume protocol", () => {
      simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      const pauseResult = simnet.callPublicFn("protocol-config", "emergency-pause", [], deployer);
      expect(pauseResult.result).toBeOk(Cl.bool(true));

      const isPaused = simnet.callReadOnlyFn("protocol-config", "is-paused", [], deployer);
      expect(isPaused.result).toBeOk(Cl.bool(true));

      const resumeResult = simnet.callPublicFn("protocol-config", "resume-protocol", [], deployer);
      expect(resumeResult.result).toBeOk(Cl.bool(true));

      const isResumed = simnet.callReadOnlyFn("protocol-config", "is-paused", [], deployer);
      expect(isResumed.result).toBeOk(Cl.bool(false));
    });
  });

  describe("propose-admin / accept-admin", () => {
    it("2-step admin transfer works", () => {
      simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      const proposeResult = simnet.callPublicFn(
        "protocol-config", "propose-admin",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(proposeResult.result).toBeOk(Cl.bool(true));

      const acceptResult = simnet.callPublicFn("protocol-config", "accept-admin", [], wallet1);
      expect(acceptResult.result).toBeOk(Cl.bool(true));
    });

    it("non-admin cannot propose new admin", () => {
      simnet.callPublicFn("protocol-config", "initialize", [], deployer);
      const { result } = simnet.callPublicFn(
        "protocol-config", "propose-admin",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(1000));
    });
  });
});
