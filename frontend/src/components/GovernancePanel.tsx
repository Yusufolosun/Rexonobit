// frontend/src/components/GovernancePanel.tsx
// Trust-weighted governance: propose, vote, execute, veto

import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import {
  proposeGovernance,
  voteGovernance,
  executeGovernanceProposal,
  vetoGovernanceProposal,
} from "../lib/transactions";
import { getGovernanceProposal } from "../lib/read";

interface GovProposal {
  id: number;
  proposer: string;
  proposalType: string;
  title: string;
  description: string;
  yesWeight: number;
  noWeight: number;
  totalWeight: number;
  status: string;
  executableAt: number;
  targetParam?: string;
  targetValue?: number;
}

const PROPOSAL_TYPES = [
  { value: "PARAM-CHANGE", label: "Protocol Parameter Change" },
  { value: "EXPEL-MEMBER", label: "Expel Member" },
  { value: "TREASURY-SPEND", label: "Treasury Spend" },
  { value: "POLICY-UPDATE", label: "Policy Update" },
];

export default function GovernancePanel() {
  const { address, connected } = useWallet();
  const [proposals, setProposals] = useState<GovProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Propose form
  const [propType, setPropType] = useState("PARAM-CHANGE");
  const [propTitle, setPropTitle] = useState("");
  const [propDesc, setPropDesc] = useState("");
  const [propParam, setPropParam] = useState("");
  const [propValue, setPropValue] = useState("");

  // Vote / execute / veto
  const [actId, setActId] = useState("");

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const props: GovProposal[] = [];
      for (let i = 1; i <= 30; i++) {
        const p = await getGovernanceProposal(i).catch(() => null);
        if (p) props.push(p as GovProposal);
        else break;
      }
      setProposals(props.reverse());
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
      <section id="governance" className="page-container">
        <div className="card alert alert-info">Connect wallet to participate in governance.</div>
      </section>
    );
  }

  const pct = (weight: number, total: number) => total > 0 ? ((weight / total) * 100).toFixed(1) : "0.0";

  const statusColor: Record<string, string> = {
    active: "#10b981",
    passed: "#3b82f6",
    executed: "#6366f1",
    failed: "#ef4444",
    vetoed: "#f59e0b",
  };

  return (
    <section id="governance" className="page-container">
      <h2 className="section-title">Governance</h2>
      <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
        Trust-weighted voting. Each member's vote weight equals their trust score, capped at 20% of total weight.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Create Proposal */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Create Proposal</h3>
        <div className="grid-2">
          <div className="form-group">
            <label>Proposal Type</label>
            <select value={propType} onChange={(e) => setPropType(e.target.value)}>
              {PROPOSAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input value={propTitle} onChange={(e) => setPropTitle(e.target.value)} placeholder="Reduce loan interest rate" />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Description</label>
            <input value={propDesc} onChange={(e) => setPropDesc(e.target.value)} placeholder="This proposal aims to…" />
          </div>
          {propType === "PARAM-CHANGE" && (
            <>
              <div className="form-group">
                <label>Parameter Key</label>
                <input value={propParam} onChange={(e) => setPropParam(e.target.value)} placeholder="loan-interest-rate-bps" />
              </div>
              <div className="form-group">
                <label>New Value</label>
                <input type="number" value={propValue} onChange={(e) => setPropValue(e.target.value)} placeholder="500" />
              </div>
            </>
          )}
        </div>
        <button
          className="btn-primary"
          disabled={txPending || !propTitle}
          onClick={() =>
            handle(
              () => proposeGovernance(propType, propTitle, propDesc, propParam || undefined, propValue ? parseInt(propValue) : undefined),
              "Proposal created"
            )
          }
        >
          {txPending ? <span className="spinner" /> : "Submit Proposal"}
        </button>
      </div>

      {/* Actions */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Vote / Execute / Veto</h3>
        <div className="form-group">
          <label>Proposal ID</label>
          <input type="number" value={actId} onChange={(e) => setActId(e.target.value)} placeholder="1" />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn-primary" disabled={txPending || !actId} onClick={() => handle(() => voteGovernance(parseInt(actId), true), "Vote YES cast")}>Vote YES</button>
          <button className="btn-secondary" disabled={txPending || !actId} onClick={() => handle(() => voteGovernance(parseInt(actId), false), "Vote NO cast")}>Vote NO</button>
          <button className="btn-secondary" disabled={txPending || !actId} onClick={() => handle(() => executeGovernanceProposal(parseInt(actId)), "Proposal executed")}>Execute</button>
          <button className="btn-secondary" disabled={txPending || !actId} onClick={() => handle(() => vetoGovernanceProposal(parseInt(actId)), "Proposal vetoed")}>Veto</button>
        </div>
      </div>

      {/* Proposals */}
      <h3 style={{ marginBottom: "0.75rem" }}>
        Proposals ({proposals.length})
        {loading && <span className="spinner" style={{ marginLeft: "0.5rem" }} />}
      </h3>
      {!loading && proposals.length === 0 && <p className="text-muted">No proposals found.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {proposals.map((p) => {
          const yesPct = parseFloat(pct(p.yesWeight, p.totalWeight));
          return (
            <div className="card" key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <div>
                  <span style={{ fontWeight: 700 }}>#{p.id} {p.title}</span>
                  <span className="badge" style={{ marginLeft: "0.5rem", background: "#334155", color: "#94a3b8", fontSize: "0.68rem" }}>{p.proposalType}</span>
                </div>
                <span className="badge" style={{ background: statusColor[p.status?.toLowerCase()] ?? "#64748b", color: "#0a0a0a", fontSize: "0.68rem" }}>{p.status}</span>
              </div>
              {p.description && <p className="text-muted text-sm" style={{ marginBottom: "0.75rem" }}>{p.description}</p>}
              <div style={{ marginBottom: "0.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.2rem" }}>
                  <span className="text-muted">YES {pct(p.yesWeight, p.totalWeight)}%</span>
                  <span className="text-muted">NO {pct(p.noWeight, p.totalWeight)}%</span>
                </div>
                <div style={{ background: "var(--color-surface)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                  <div style={{ width: `${yesPct}%`, height: "100%", background: "#10b981", borderRadius: "4px", transition: "width 0.4s ease" }} />
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Total weight: {p.totalWeight} · Executable at block: {p.executableAt}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
