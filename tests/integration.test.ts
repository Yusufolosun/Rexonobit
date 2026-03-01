import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice    = accounts.get("wallet_1")!;
const bob      = accounts.get("wallet_2")!;

function initAll() {
  simnet.callPublicFn("protocol-config", "initialize", [], deployer);
  simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Alice")], alice);
  simnet.callPublicFn("cooperative-registry", "register-member", [Cl.stringUtf8("Bob")], bob);
  // Open circle: request-join auto-admits Bob
  simnet.callPublicFn("cooperative-registry", "create-circle", [
    Cl.stringUtf8("Integration Circle"),
    Cl.stringUtf8("For integration tests"),
    Cl.bool(true),
    Cl.uint(0)
  ], alice);
  simnet.callPublicFn("cooperative-registry", "request-join", [Cl.uint(1)], bob);
  // Trust score setup (needed for governance vote and other features)
  simnet.callPublicFn("trust-score", "set-authorized-writer", [Cl.principal(deployer), Cl.bool(true)], deployer);
  simnet.callPublicFn("trust-score", "initialize-score", [Cl.principal(alice)], deployer);
  simnet.callPublicFn("trust-score", "initialize-score", [Cl.principal(bob)], deployer);
}

describe("integration", () => {
  it("register -> deposit -> check balance", () => {
    initAll();
    simnet.callPublicFn("savings-vault", "initialize-vault", [], alice);
    simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(5_000_000)], alice);
    const balance = simnet.callReadOnlyFn("savings-vault", "get-vault-balance", [Cl.principal(alice)], deployer);
    expect(balance.result).toBeOk(Cl.uint(5_000_000));
  });

  it("deposit -> lock -> verify locked balance", () => {
    initAll();
    simnet.callPublicFn("savings-vault", "initialize-vault", [], alice);
    simnet.callPublicFn("savings-vault", "deposit", [Cl.uint(10_000_000)], alice);
    simnet.callPublicFn("savings-vault", "lock-savings", [Cl.uint(5_000_000), Cl.uint(2016)], alice);
    const locked = simnet.callReadOnlyFn("savings-vault", "get-locked-balance", [Cl.principal(alice)], deployer);
    expect(locked.result).toBeOk(Cl.uint(5_000_000));
  });

  it("ROSCA lifecycle: create and join", () => {
    initAll();
    const createResult = simnet.callPublicFn("rosca", "create-rosca", [
      Cl.stringUtf8("Test ROSCA"),
      Cl.uint(1_000_000),
      Cl.uint(3),
      Cl.uint(4320)
    ], alice);
    expect(createResult.result).toBeOk(Cl.uint(1));
    const joinResult = simnet.callPublicFn("rosca", "join-rosca", [Cl.uint(1)], bob);
    expect(joinResult.result).toBeOk(Cl.uint(2)); // second member joins
  });

  it("task lifecycle: post and bid", () => {
    initAll();
    const postResult = simnet.callPublicFn("labor-market", "post-task", [
      Cl.uint(1),
      Cl.stringUtf8("Build smart contract"),
      Cl.stringUtf8("Build a Clarity smart contract for the project"),
      Cl.uint(5_000_000)
    ], alice);
    expect(postResult.result).toBeOk(Cl.uint(1));
    const bidResult = simnet.callPublicFn("labor-market", "bid-task", [
      Cl.uint(1),
      Cl.stringUtf8("I can build this contract")
    ], bob);
    expect(bidResult.result).toBeOk(Cl.bool(true));
  });

  it("governance: propose and vote", () => {
    initAll();
    const proposeResult = simnet.callPublicFn("governance", "propose", [
      Cl.uint(1),
      Cl.uint(1),
      Cl.stringUtf8("Increase min deposit"),
      Cl.stringUtf8("Proposal to raise the minimum deposit requirement"),
      Cl.stringAscii("min-deposit-ustx"),
      Cl.uint(500_000),
      Cl.none()
    ], alice);
    expect(proposeResult.result).toBeOk(Cl.uint(1));
    const voteResult = simnet.callPublicFn("governance", "vote", [Cl.uint(1), Cl.bool(true)], alice);
    // vote returns (ok effective-weight); weight is capped at 20% of projected total
    expect(voteResult.result).toBeOk(Cl.uint(20));
  });

  it("arbitration: open dispute", () => {
    initAll();
    const { result } = simnet.callPublicFn("arbitration", "open-dispute", [
      Cl.principal(bob),
      Cl.uint(1),
      Cl.stringUtf8("Breach of contract terms"),
      Cl.stringUtf8("Evidence of the breach including transaction records")
    ], alice);
    expect(result).toBeOk(Cl.uint(1));
  });
});
