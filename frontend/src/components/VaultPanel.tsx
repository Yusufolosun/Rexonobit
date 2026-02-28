// frontend/src/components/VaultPanel.tsx
// STX savings vault: deposit, lock, withdraw with streak display

/**
 * VaultPanel — savings vault interface.
 * Manages deposit, lock-savings, withdraw, and withdraw-locked flows.
 * Powered by the `useVault` hook; uses `useFormField` for validated inputs.
 */

import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { deposit, lockSavings, withdraw, withdrawLocked } from "../lib/transactions";
import { useFormField } from "../hooks/useFormField";
import { validateSTX, validateBlockCount } from "../lib/validators";
import { FormInput } from "./FormInput";
import { useToast } from "../context/ToastContext";
import { useWindowFocus } from "../hooks/useWindowFocus";
import { useVault } from "../hooks/useVault";

export default function VaultPanel() {
  const { address, connected } = useWallet();
  const { balance, lockedBalance, lockedUntil, streak, loading: loadingData, refresh } = useVault(address);
  const [txPending, setTxPending] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const depositField = useFormField("", validateSTX);
  const lockAmtField = useFormField("", validateSTX);
  const lockBlocksField = useFormField("2016", (v) => validateBlockCount(v, 144, 52560, "Lock duration"));

  useWindowFocus(refresh);

  const handle = async (fn: () => Promise<{ txid: string }>, msg: string) => {
    setTxPending(true);
    try {
      const res = await fn();
      toastSuccess(`${msg} submitted`, res.txid);
      setTimeout(refresh, 3000);
    } catch (e) {
      toastError(String(e));
    } finally {
      setTxPending(false);
    }
  };

  if (!connected) return <div className="card alert alert-info">Connect wallet to manage your vault.</div>;

  const stx = (micro: number) => (micro / 1_000_000).toFixed(4);

  return (
    <section id="vault" className="page-container" aria-labelledby="vault-title">
      <h2 id="vault-title" className="section-title">Savings Vault</h2>

      {loadingData && <div role="status" aria-live="polite" style={{ display: "flex", gap: ".5rem", alignItems: "center" }}><span className="spinner" aria-hidden="true" /> Refreshing…</div>}

      {!loadingData && (
        <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
          <div className="card">
            <span className="text-sm text-muted">Available</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{stx(balance)} <span className="text-muted" style={{ fontSize: "0.8rem" }}>STX</span></div>
          </div>
          <div className="card">
            <span className="text-sm text-muted">Locked</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{stx(lockedBalance)} <span className="text-muted" style={{ fontSize: "0.8rem" }}>STX</span></div>
            {lockedUntil > 0 && <div className="text-muted" style={{ fontSize: "0.75rem" }}>until block {lockedUntil}</div>}
          </div>
          <div className="card">
            <span className="text-sm text-muted">Deposit Streak</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{streak} <span className="text-muted" style={{ fontSize: "0.8rem" }}>cycles</span></div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Deposit */}
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Deposit STX</h3>
          <FormInput
            label="Amount (STX)"
            type="number"
            min="0.000001"
            step="0.000001"
            placeholder="0.0"
            value={depositField.value}
            onChange={depositField.onChange}
            onBlur={depositField.onBlur}
            error={depositField.error}
          />
          <button
            className="btn-primary"
            disabled={txPending || !depositField.value}
            onClick={() => {
              if (!depositField.validate()) return;
              handle(() => deposit(Math.floor(parseFloat(depositField.value) * 1_000_000)), "Deposit submitted");
            }}
          >
            {txPending ? <span className="spinner" /> : "Deposit"}
          </button>
        </div>

        {/* Withdraw */}
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Withdraw STX</h3>
          <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>Withdraw all available (unlocked) STX from vault.</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              className="btn-secondary"
              disabled={txPending}
              onClick={() => handle(() => withdraw(), "Withdraw submitted")}
              style={{ flex: 1 }}
            >
              Withdraw Available
            </button>
            <button
              className="btn-secondary"
              disabled={txPending}
              onClick={() => handle(() => withdrawLocked(), "Unlock withdraw submitted")}
              style={{ flex: 1 }}
            >
              Withdraw Locked
            </button>
          </div>
        </div>

        {/* Lock Savings */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <h3 style={{ marginBottom: "1rem" }}>Lock Savings (earn bonus trust points)</h3>
          <div className="grid-2">
            <FormInput
              label="Amount to Lock (STX)"
              type="number"
              min="0.000001"
              step="0.000001"
              placeholder="0.0"
              value={lockAmtField.value}
              onChange={lockAmtField.onChange}
              onBlur={lockAmtField.onBlur}
              error={lockAmtField.error}
            />
            <FormInput
              label="Lock Duration (blocks)"
              type="number"
              min="144"
              step="144"
              placeholder="2016"
              hint={`≈ ${Math.round(parseInt(lockBlocksField.value || "0") / 144)} days`}
              value={lockBlocksField.value}
              onChange={lockBlocksField.onChange}
              onBlur={lockBlocksField.onBlur}
              error={lockBlocksField.error}
            />
          </div>
          <button
            className="btn-primary"
            disabled={txPending || !lockAmtField.value || !lockBlocksField.value}
            onClick={() => {
              const a = lockAmtField.validate();
              const b = lockBlocksField.validate();
              if (!a || !b) return;
              handle(
                () => lockSavings(Math.floor(parseFloat(lockAmtField.value) * 1_000_000), parseInt(lockBlocksField.value)),
                "Lock submitted"
              );
            }}
          >
            {txPending ? <span className="spinner" /> : "Lock Savings"}
          </button>
        </div>
      </div>
    </section>
  );
}
