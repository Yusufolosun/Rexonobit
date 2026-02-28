// frontend/src/components/GovernancePanel.tsx
// Trust-weighted governance: propose, vote, execute, veto

/**
 * GovernancePanel — on-chain governance interface.
 * Supports proposal creation (parameter changes, treasury spends, policy
 * updates, member expulsion), trust-weighted voting, execution, and veto.
 */

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import {
  createProposal,
  voteOnGovProposal,
  executeGovProposal,
  vetoGovProposal,
} from "../lib/transactions";
import { getGovernanceProposal } from "../lib/read";
import { useFormField } from "../hooks/useFormField";
import { validateRequired, validateMaxLength, validatePositiveInt } from "../lib/validators";
import { SkeletonCard } from "./SkeletonCard";
import { useToast } from "../context/ToastContext";
import { useWindowFocus } from "../hooks/useWindowFocus";
import { ErrorAlert } from "./ErrorAlert";
import { useContractError } from "../hooks/useContractError";

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
  { value: 1, label: "Protocol Parameter Change" },
  { value: 2, label: "Expel Member" },
  { value: 3, label: "Treasury Spend" },
  { value: 4, label: "Policy Update" },
];

export default function GovernancePanel() {
  const { address, connected } = useWallet();
  const [proposals, setProposals] = useState<GovProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const { success: toastSuccess } = useToast();
  const { error: contractError, clearError, setError } = useContractError();

  // Propose form with validation
  const [propType, setPropType] = useState(1);
  const propTitle = useFormField("", (v) => validateMaxLength(v, 80, "Title"));
  const propDesc = useFormField("", (v) => validateMaxLength(v, 400, "Description"));
  const propParam = useFormField("", (v) => validateRequired(v, "Parameter key"));
  const propValue = useFormField("", (v) => validatePositiveInt(v, "Parameter value"));
  const propCircleId = useFormField("", (v) => validatePositiveInt(v, "Circle ID"));
  const propTarget = useFormField("");

  // Vote / execute / veto
  const actId = useFormField("", (v) => validatePositiveInt(v, "Proposal ID"));

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
  useWindowFocus(refresh);

  const handle = async (fn: () => Promise<{ txid: string }>, msg: string) => {
    setTxPending(true);
    try {
      const res = await fn();
      toastSuccess(msg, res.txid);
      clearError();
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
    <section id="governance" className="page-container" aria-labelledby="governance-title">
      <h2 id="governance-title" className="section-title">Governance</h2>
      <ErrorAlert error={contractError} onDismiss={clearError} />
      <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
        Trust-weighted voting. Each member's vote weight equals their trust score, capped at 20% of total weight.
      </p>

      {/* Create Proposal */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Create Proposal</h3>
        <div className="grid-2">
          <div className="form-group">
            <label>Circle ID</label>
            <input type="number" value={propCircleId.value} onChange={propCircleId.onChange} onBlur={propCircleId.onBlur} placeholder="1" />
          </div>
          <div className="form-group">
            <label>Proposal Type</label>
            <select value={propType} onChange={(e) => setPropType(Number(e.target.value))}>
              {PROPOSAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input value={propTitle.value} onChange={propTitle.onChange} onBlur={propTitle.onBlur} placeholder="Reduce loan interest rate" />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Description</label>
            <input value={propDesc.value} onChange={propDesc.onChange} onBlur={propDesc.onBlur} placeholder="This proposal aims to…" />
          </div>
          {propType === 1 && (
            <>
              <div className="form-group">
                <label>Parameter Key</label>
                <input value={propParam.value} onChange={propParam.onChange} onBlur={propParam.onBlur} placeholder="loan-interest-rate-bps" />
              </div>
              <div className="form-group">
                <label>New Value</label>
                <input type="number" value={propValue.value} onChange={propValue.onChange} onBlur={propValue.onBlur} placeholder="500" />
              </div>
            </>
          )}
          {propType === 2 && (
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Target Principal</label>
              <input value={propTarget.value} onChange={propTarget.onChange} onBlur={propTarget.onBlur} placeholder="SP…" />
            </div>
          )}
        </div>
        <button
          className="btn-primary"
          aria-busy={txPending}
          aria-label="Submit governance proposal"
          disabled={txPending || !propTitle.value}
          onClick={() =>
            handle(
              () => createProposal(
                parseInt(propCircleId.value) || 1,
                propType,
                propTitle.value,
                propDesc.value,
                propParam.value || "",
                propValue.value ? parseInt(propValue.value) : 0,
                propTarget.value || null
              ),
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
          <input type="number" value={actId.value} onChange={actId.onChange} onBlur={actId.onBlur} placeholder="1" />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn-primary" aria-busy={txPending} aria-label="Vote yes on proposal" disabled={txPending || !actId.value} onClick={() => handle(() => voteOnGovProposal(parseInt(actId.value), true), "Vote YES cast")}>Vote YES</button>
          <button className="btn-secondary" aria-busy={txPending} aria-label="Vote no on proposal" disabled={txPending || !actId.value} onClick={() => handle(() => voteOnGovProposal(parseInt(actId.value), false), "Vote NO cast")}>Vote NO</button>
          <button className="btn-secondary" aria-busy={txPending} aria-label="Execute proposal" disabled={txPending || !actId.value} onClick={() => handle(() => executeGovProposal(parseInt(actId.value)), "Proposal executed")}>Execute</button>
          <button className="btn-secondary" aria-busy={txPending} aria-label="Veto proposal" disabled={txPending || !actId.value} onClick={() => handle(() => vetoGovProposal(parseInt(actId.value)), "Proposal vetoed")}>Veto</button>
        </div>
      </div>

      {/* Proposals */}
      <h3 style={{ marginBottom: "0.75rem" }}>Proposals ({proposals.length})</h3>
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {[1,2].map(i => <SkeletonCard key={i} lines={4} height="120px" />)}
        </div>
      )}
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
