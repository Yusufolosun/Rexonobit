// frontend/src/components/SCreditPanel.tsx
// sCREDIT synthetic credit token: mint, burn, transfer, view credit limit

/**
 * SCreditPanel — synthetic credit (sCREDIT) interface.
 * Mint sCREDIT against locked savings collateral, burn to repay,
 * transfer to peers. Credit limit is determined by trust score ×
 * locked savings balance via the synthetic-credit contract.
 */

import React, { useState, useMemo } from "react";
import { useWallet } from "../context/WalletContext";
import { mintSCredit, burnSCredit, transferSCredit } from "../lib/transactions";
import { useSCredit } from "../hooks/useSCredit";
import { useFormField } from "../hooks/useFormField";
import { validateSTX, validatePrincipal } from "../lib/validators";
import { SkeletonCard } from "./SkeletonCard";
import { useToast } from "../context/ToastContext";

export default function SCreditPanel() {
  const { address, connected } = useWallet();
  const { balance, creditLimit, trustScore, lockedSavings, loading, refresh } = useSCredit(address);

  /** Amount of sCREDIT already minted (outstanding) */
  const minted = useMemo(
    () => (creditLimit > 0 ? Math.max(0, creditLimit - balance) : 0),
    [creditLimit, balance]
  );
  /** Amount of sCREDIT still available to mint */
  const available = useMemo(() => Math.max(0, creditLimit - minted), [creditLimit, minted]);
  /** Utilization percentage as a formatted string */
  const utilizationPct = useMemo(
    () => (creditLimit > 0 ? ((minted / creditLimit) * 100).toFixed(1) : "0.0"),
    [minted, creditLimit]
  );

  const [txPending, setTxPending] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  // Forms with validation
  const mintAmt = useFormField("", validateSTX);
  const burnAmt = useFormField("", validateSTX);
  const transferTo = useFormField("", validatePrincipal);
  const transferAmt = useFormField("", validateSTX);

  const handle = async (fn: () => Promise<{ txid: string }>, msg: string) => {
    setTxPending(true);
    try {
      const res = await fn();
      toastSuccess(msg, res.txid);
      setTimeout(refresh, 4000);
    } catch (e) {
      toastError(String(e));
    } finally {
      setTxPending(false);
    }
  };

  if (!connected) {
    return (
      <section id="scredit" className="page-container">
        <div className="card alert alert-info">Connect wallet to access sCREDIT.</div>
      </section>
    );
  }

  const fmt = (v: number) => v.toLocaleString();
  const stx = (v: number) => (v / 1_000_000).toFixed(4);

  return (
    <section id="scredit" className="page-container" aria-labelledby="scredit-title">
      <h2 id="scredit-title" className="section-title">sCREDIT — Synthetic Credit</h2>
      <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
        Mint sCREDIT against locked savings. Credit limit = locked STX × 50%. Requires trust score ≥ 700.
      </p>

      {loading && (
        <div className="grid-3" style={{ marginBottom: "2rem" }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} lines={3} height="90px" />)}
        </div>
      )}

      {!loading && (
        <>
          <div className="grid-3" style={{ marginBottom: "2rem" }}>
            <div className="card">
              <span className="text-muted text-sm">sCREDIT Balance</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(balance)} <span className="text-muted" style={{ fontSize: "0.8rem" }}>sCREDIT</span></div>
            </div>
            <div className="card">
              <span className="text-muted text-sm">Credit Limit</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(creditLimit)} <span className="text-muted" style={{ fontSize: "0.8rem" }}>sCREDIT</span></div>
            </div>
            <div className="card">
              <span className="text-muted text-sm">Available</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(available)} <span className="text-muted" style={{ fontSize: "0.8rem" }}>sCREDIT</span></div>
            </div>
            <div className="card">
              <span className="text-muted text-sm">Trust Score</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{trustScore} <span className="text-muted" style={{ fontSize: "0.8rem" }}>/ 1000</span></div>
              {trustScore < 700 && <span className="badge" style={{ background: "#ef4444", color: "#fff", fontSize: "0.68rem" }}>Need 700+</span>}
            </div>
            <div className="card">
              <span className="text-muted text-sm">Locked Savings</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{stx(lockedSavings)} <span className="text-muted" style={{ fontSize: "0.8rem" }}>STX</span></div>
            </div>
            <div className="card">
              <span className="text-muted text-sm">Utilization</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{utilizationPct}<span className="text-muted" style={{ fontSize: "0.8rem" }}>%</span></div>
              <div style={{ background: "var(--color-surface)", borderRadius: "4px", height: "6px", marginTop: "0.4rem" }}>
                <div style={{ width: `${utilizationPct}%`, height: "100%", background: "var(--color-primary)", borderRadius: "4px" }} />
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Mint */}
            <div className="card">
              <h3 style={{ marginBottom: "1rem" }}>Mint sCREDIT</h3>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" value={mintAmt.value} onChange={mintAmt.onChange} onBlur={mintAmt.onBlur} placeholder="1000" min="1" aria-invalid={!!mintAmt.error} />
                {mintAmt.error && <span className="form-error" role="alert">{mintAmt.error}</span>}
              </div>
              <button
                className="btn-primary"
                disabled={txPending || !mintAmt.value || trustScore < 700}
                onClick={() => {
                  if (!mintAmt.validate()) return;
                  handle(() => mintSCredit(parseInt(mintAmt.value)), "Mint submitted");
                }}
              >
                {txPending ? <span className="spinner" /> : "Mint sCREDIT"}
              </button>
              {trustScore < 700 && <p className="text-muted text-sm" style={{ marginTop: "0.5rem" }}>Trust score too low to mint.</p>}
            </div>

            {/* Burn */}
            <div className="card">
              <h3 style={{ marginBottom: "1rem" }}>Burn sCREDIT</h3>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" value={burnAmt.value} onChange={burnAmt.onChange} onBlur={burnAmt.onBlur} placeholder="500" min="1" aria-invalid={!!burnAmt.error} />
                {burnAmt.error && <span className="form-error" role="alert">{burnAmt.error}</span>}
              </div>
              <button
                className="btn-secondary"
                disabled={txPending || !burnAmt.value}
                onClick={() => {
                  if (!burnAmt.validate()) return;
                  handle(() => burnSCredit(parseInt(burnAmt.value)), "Burn submitted");
                }}
              >
                {txPending ? <span className="spinner" /> : "Burn sCREDIT"}
              </button>
            </div>

            {/* Transfer */}
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <h3 style={{ marginBottom: "1rem" }}>Transfer sCREDIT</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label>Recipient</label>
                  <input value={transferTo.value} onChange={transferTo.onChange} onBlur={transferTo.onBlur} placeholder="ST1PQHQ…" aria-invalid={!!transferTo.error} />
                  {transferTo.error && <span className="form-error" role="alert">{transferTo.error}</span>}
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" value={transferAmt.value} onChange={transferAmt.onChange} onBlur={transferAmt.onBlur} placeholder="100" min="1" aria-invalid={!!transferAmt.error} />
                  {transferAmt.error && <span className="form-error" role="alert">{transferAmt.error}</span>}
                </div>
              </div>
              <button
                className="btn-secondary"
                disabled={txPending || !transferTo.value || !transferAmt.value}
                onClick={() => {
                  if (!transferTo.validate() || !transferAmt.validate()) return;
                  handle(() => transferSCredit(parseInt(transferAmt.value), transferTo.value), "Transfer submitted");
                }}
              >
                {txPending ? <span className="spinner" /> : "Transfer"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
