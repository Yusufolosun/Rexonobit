// frontend/src/components/ArbitrationPanel.tsx
// Decentralized dispute resolution: open dispute, join panel, submit verdict, close

/**
 * ArbitrationPanel — dispute resolution interface.
 * Allows members to open disputes, join arbitration panels, submit
 * verdicts, and close resolved disputes. Integrates with trust-score
 * for penalty application on losing parties.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useWallet } from "../context/WalletContext";
import {
  openDispute,
  joinArbitrationPanel,
  submitVerdict,
  closeDispute,
} from "../lib/transactions";
import { getDispute } from "../lib/read";
import { useFormField } from "../hooks/useFormField";
import { validatePrincipal, validatePositiveInt, validateMaxLength } from "../lib/validators";
import { SkeletonCard } from "./SkeletonCard";
import { useToast } from "../context/ToastContext";
import { useWindowFocus } from "../hooks/useWindowFocus";

interface Dispute {
  id: number;
  claimant: string;
  respondent: string;
  circleId: number;
  description: string;
  panel: string[];
  verdict: number; // 0=none, 1=claimant wins, 2=respondent wins, 3=split
  status: string;
  escrowFee: number;
  verdictCount: number;
}

const VERDICT_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Claimant Wins",
  2: "Respondent Wins",
  3: "Split",
};

export default function ArbitrationPanel() {
  const { address, connected } = useWallet();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  // Open dispute form with validation
  const respondent = useFormField("", validatePrincipal);
  const circleId = useFormField("", (v) => validatePositiveInt(v, "Circle ID"));
  const disputeDesc = useFormField("", (v) => validateMaxLength(v, 300, "Description"));

  // Actions with validation
  const actDisputeId = useFormField("", (v) => validatePositiveInt(v, "Dispute ID"));
  const [verdictChoice, setVerdictChoice] = useState("1");
  const verdictReason = useFormField("", (v) => validateMaxLength(v, 200, "Reasoning"));

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const list: Dispute[] = [];
      for (let i = 1; i <= 30; i++) {
        const d = await getDispute(i).catch(() => null);
        if (d) list.push(d as Dispute);
        else break;
      }
      setDisputes(list.reverse());
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);
  useWindowFocus(refresh);

  /** Disputes that are still open / awaiting verdict */
  const openDisputes = useMemo(
    () => disputes.filter((d) => d.status?.toLowerCase() === "open"),
    [disputes]
  );
  /** Disputes that have been resolved or closed */
  const closedDisputes = useMemo(
    () => disputes.filter((d) => d.status?.toLowerCase() !== "open"),
    [disputes]
  );

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
      <section id="arbitration" className="page-container">
        <div className="card alert alert-info">Connect wallet to access arbitration.</div>
      </section>
    );
  }

  const stx = (v: number) => (v / 1_000_000).toFixed(4);
  const trunc = (addr: string) => addr ? `${addr.slice(0, 8)}…${addr.slice(-4)}` : "—";

  const statusColor: Record<string, string> = {
    open: "#f59e0b",
    "panel-forming": "#3b82f6",
    deliberating: "#8b5cf6",
    closed: "#10b981",
    cancelled: "#ef4444",
  };

  return (
    <section id="arbitration" className="page-container" aria-labelledby="arbitration-title">
      <h2 id="arbitration-title" className="section-title">Arbitration</h2>
      <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
        3-member inter-circle panel resolves disputes. Panelists must have trust ≥ 400 and not be from the same circle.
      </p>

      {/* Open Dispute */}}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Open a Dispute</h3>
        <p className="text-muted text-sm" style={{ marginBottom: "0.75rem" }}>
          Opening a dispute locks 0.5 STX as arbitration fee, paid to the 3-panel arbitrators on resolution.
        </p>
        <div className="grid-2">
          <div className="form-group">
            <label>Respondent (principal)</label>
            <input value={respondent} onChange={(e) => setRespondent(e.target.value)} placeholder="ST1PQHQ…" />
          </div>
          <div className="form-group">
            <label>Circle ID</label>
            <input type="number" value={circleId} onChange={(e) => setCircleId(e.target.value)} placeholder="1" />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Description of Dispute</label>
            <input value={disputeDesc} onChange={(e) => setDisputeDesc(e.target.value)} placeholder="Worker failed to deliver…" />
          </div>
        </div>
        <button
          className="btn-primary"
          disabled={txPending || !respondent || !circleId}
          onClick={() =>
            handle(
              () => openDispute(respondent, parseInt(circleId), disputeDesc),
              "Dispute opened"
            )
          }
        >
          {txPending ? <span className="spinner" /> : "Open Dispute"}
        </button>
      </div>

      {/* Arbitration actions */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Panel & Verdict Actions</h3>
        <div className="form-group">
          <label>Dispute ID</label>
          <input type="number" value={actDisputeId} onChange={(e) => setActDisputeId(e.target.value)} placeholder="1" />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            className="btn-secondary"
            disabled={txPending || !actDisputeId}
            onClick={() => handle(() => joinArbitrationPanel(parseInt(actDisputeId)), "Joined panel")}
          >
            Join Panel
          </button>
          <button
            className="btn-secondary"
            disabled={txPending || !actDisputeId}
            onClick={() => handle(() => closeDispute(parseInt(actDisputeId)), "Dispute closed")}
          >
            Close Dispute
          </button>
        </div>

        {/* Verdict */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
          <h4 style={{ marginBottom: "0.75rem", fontSize: "0.92rem" }}>Submit Verdict (panel members only)</h4>
          <div className="grid-2">
            <div className="form-group">
              <label>Verdict</label>
              <select value={verdictChoice} onChange={(e) => setVerdictChoice(e.target.value)}>
                <option value="1">1 — Claimant Wins</option>
                <option value="2">2 — Respondent Wins</option>
                <option value="3">3 — Split</option>
              </select>
            </div>
            <div className="form-group">
              <label>Reasoning</label>
              <input value={verdictReason} onChange={(e) => setVerdictReason(e.target.value)} placeholder="Based on evidence…" />
            </div>
          </div>
          <button
            className="btn-primary"
            disabled={txPending || !actDisputeId}
            onClick={() => handle(() => submitVerdict(parseInt(actDisputeId), parseInt(verdictChoice), verdictReason), "Verdict submitted")}
          >
            {txPending ? <span className="spinner" /> : "Submit Verdict"}
          </button>
        </div>
      </div>

      {/* Disputes list */}
      <h3 style={{ marginBottom: "0.75rem" }}>Disputes ({disputes.length})</h3>
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
          {[1, 2].map((i) => <SkeletonCard key={i} lines={4} height="120px" />)}
        </div>
      )}
      {!loading && disputes.length === 0 && <p className="text-muted">No disputes.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {disputes.map((d) => (
          <div className="card" key={d.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 700 }}>Dispute #{d.id}</span>
              <span className="badge" style={{ background: statusColor[d.status?.toLowerCase()] ?? "#64748b", color: "#0a0a0a", fontSize: "0.68rem" }}>{d.status}</span>
            </div>
            {d.description && <p className="text-muted text-sm" style={{ marginBottom: "0.5rem" }}>{d.description}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.3rem", fontSize: "0.78rem" }}>
              <div><span className="text-muted">Claimant</span><br /><strong title={d.claimant}>{trunc(d.claimant)}</strong></div>
              <div><span className="text-muted">Respondent</span><br /><strong title={d.respondent}>{trunc(d.respondent)}</strong></div>
              <div><span className="text-muted">Escrow</span><br /><strong>{stx(d.escrowFee)} STX</strong></div>
              <div><span className="text-muted">Verdict</span><br /><strong>{VERDICT_LABELS[d.verdict] ?? "—"}</strong></div>
            </div>
            {d.panel?.length > 0 && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                Panel ({d.panel.length}/3): {d.panel.map(trunc).join(" · ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
