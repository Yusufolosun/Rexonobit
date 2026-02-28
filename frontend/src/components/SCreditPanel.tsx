// frontend/src/components/SCreditPanel.tsx
// sCREDIT synthetic credit token: mint, burn, transfer, view credit limit

import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import { mintSCredit, burnSCredit, transferSCredit } from "../lib/transactions";
import { getSCreditBalance, getCreditLimit, getTrustScore, getLockedBalance } from "../lib/read";
import { useFormField } from "../hooks/useFormField";
import { validateSTX, validatePrincipal } from "../lib/validators";

interface CreditState {
  balance: number;
  creditLimit: number;
  minted: number;
  available: number;
  trustScore: number;
  lockedSavings: number;
}

export default function SCreditPanel() {
  const { address, connected } = useWallet();
  const [state, setState] = useState<CreditState | null>(null);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Forms with validation
  const mintAmt = useFormField("", validateSTX);
  const burnAmt = useFormField("", validateSTX);
  const transferTo = useFormField("", validatePrincipal);
  const transferAmt = useFormField("", validateSTX);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [balance, creditLimit, lockedSavings, trustScore] = await Promise.all([
        getSCreditBalance(address).catch(() => 0),
        getCreditLimit(address).catch(() => 0),
        getLockedBalance(address).catch(() => 0),
        getTrustScore(address).catch(() => 0),
      ]);
      const minted = Number(creditLimit) > 0
        ? Math.max(0, Number(creditLimit) - Number(balance))
        : 0;
      setState({
        balance: Number(balance),
        creditLimit: Number(creditLimit),
        minted,
        available: Math.max(0, Number(creditLimit) - minted),
        trustScore: Number(trustScore),
        lockedSavings: Number(lockedSavings),
      });
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  const handle = async (fn: () => Promise<{ txid: string }>, msg: string) => {
    setTxPending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fn();
      setSuccess(`${msg} — txid: ${res.txid.slice(0, 12)}…`);
      setTimeout(refresh, 4000);
    } catch (e) {
      setError(String(e));
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
  const utilizationPct = state && state.creditLimit > 0
    ? ((state.minted / state.creditLimit) * 100).toFixed(1)
    : "0.0";

  return (
    <section id="scredit" className="page-container">
      <h2 className="section-title">sCREDIT — Synthetic Credit</h2>
      <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
        Mint sCREDIT against locked savings. Credit limit = locked STX × 50%. Requires trust score ≥ 700.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading && <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}><span className="spinner" /> Loading…</div>}

      {state && (
        <>
          <div className="grid-3" style={{ marginBottom: "2rem" }}>
            <div className="card">
              <span className="text-muted text-sm">sCREDIT Balance</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(state.balance)} <span className="text-muted" style={{ fontSize: "0.8rem" }}>sCREDIT</span></div>
            </div>
            <div className="card">
              <span className="text-muted text-sm">Credit Limit</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(state.creditLimit)} <span className="text-muted" style={{ fontSize: "0.8rem" }}>sCREDIT</span></div>
            </div>
            <div className="card">
              <span className="text-muted text-sm">Available</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(state.available)} <span className="text-muted" style={{ fontSize: "0.8rem" }}>sCREDIT</span></div>
            </div>
            <div className="card">
              <span className="text-muted text-sm">Trust Score</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{state.trustScore} <span className="text-muted" style={{ fontSize: "0.8rem" }}>/ 1000</span></div>
              {state.trustScore < 700 && <span className="badge" style={{ background: "#ef4444", color: "#fff", fontSize: "0.68rem" }}>Need 700+</span>}
            </div>
            <div className="card">
              <span className="text-muted text-sm">Locked Savings</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{stx(state.lockedSavings)} <span className="text-muted" style={{ fontSize: "0.8rem" }}>STX</span></div>
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
                <input type="number" value={mintAmt} onChange={(e) => setMintAmt(e.target.value)} placeholder="1000" min="1" />
              </div>
              <button
                className="btn-primary"
                disabled={txPending || !mintAmt || state.trustScore < 700}
                onClick={() => handle(() => mintSCredit(parseInt(mintAmt)), "Mint submitted")}
              >
                {txPending ? <span className="spinner" /> : "Mint sCREDIT"}
              </button>
              {state.trustScore < 700 && <p className="text-muted text-sm" style={{ marginTop: "0.5rem" }}>Trust score too low to mint.</p>}
            </div>

            {/* Burn */}
            <div className="card">
              <h3 style={{ marginBottom: "1rem" }}>Burn sCREDIT</h3>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" value={burnAmt} onChange={(e) => setBurnAmt(e.target.value)} placeholder="500" min="1" />
              </div>
              <button
                className="btn-secondary"
                disabled={txPending || !burnAmt}
                onClick={() => handle(() => burnSCredit(parseInt(burnAmt)), "Burn submitted")}
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
                  <input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="ST1PQHQ…" />
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" value={transferAmt} onChange={(e) => setTransferAmt(e.target.value)} placeholder="100" min="1" />
                </div>
              </div>
              <button
                className="btn-secondary"
                disabled={txPending || !transferTo || !transferAmt}
                onClick={() => handle(() => transferSCredit(parseInt(transferAmt), transferTo), "Transfer submitted")}
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
