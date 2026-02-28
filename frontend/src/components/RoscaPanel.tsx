// frontend/src/components/RoscaPanel.tsx
// Rotating savings (Susu/Chit Fund): create, join, contribute, set order, payout

/**
 * RoscaPanel — ROSCA (Rotating Savings and Credit Association) interface.
 * Manages circle creation, membership, contribution, payout ordering,
 * and cycle management. On-chain Susu/Tontine/Chit-Fund mechanics.
 */

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import {
  createRosca,
  joinRosca,
  lockAndStart,
  contribute,
  payout,
  setPayoutOrder,
} from "../lib/transactions";
import { getRosca } from "../lib/read";
import { useFormField } from "../hooks/useFormField";
import { validateSTX, validatePositiveInt, validateBlockCount, validateMaxLength, validatePrincipalList } from "../lib/validators";
import { SkeletonCard } from "./SkeletonCard";
import { useToast } from "../context/ToastContext";
import { useWindowFocus } from "../hooks/useWindowFocus";
import { ErrorAlert } from "./ErrorAlert";
import { useContractError } from "../hooks/useContractError";

interface RoscaData {
  id: number;
  name: string;
  admin: string;
  cycleBlocks: number;
  contributionAmount: number;
  maxMembers: number;
  memberCount: number;
  status: string;
  currentCycle: number;
  totalCycles: number;
}

export default function RoscaPanel() {
  const { address, connected } = useWallet();
  const [roscas, setRoscas] = useState<RoscaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const { success: toastSuccess } = useToast();
  const { error: contractError, clearError, setError } = useContractError();

  // Create form with validation
  const rName = useFormField("", (v) => validateMaxLength(v, 50, "Name"));
  const rContrib = useFormField("", validateSTX);
  const rCycle = useFormField("1008", (v) => validateBlockCount(v, 144, 52560, "Cycle length"));
  const rMax = useFormField("5", (v) => validatePositiveInt(v, "Max members"));

  // Action forms with validation
  const actRoscaId = useFormField("", (v) => validatePositiveInt(v, "ROSCA ID"));
  const orderList = useFormField("", validatePrincipalList);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const fetched: RoscaData[] = [];
      for (let i = 1; i <= 20; i++) {
        const r = await getRosca(i).catch(() => null);
        if (r) fetched.push(r as RoscaData);
        else break;
      }
      setRoscas(fetched);
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
      <section id="rosca" className="page-container">
        <div className="card alert alert-info">Connect wallet to access ROSCA groups.</div>
      </section>
    );
  }

  const stx = (v: number) => (v / 1_000_000).toFixed(4);

  const statusColor: Record<string, string> = {
    pending: "#f59e0b",
    active: "#10b981",
    complete: "#3b82f6",
    cancelled: "#ef4444",
  };

  return (
    <section id="rosca" className="page-container" aria-labelledby="rosca-title">
      <h2 id="rosca-title" className="section-title">ROSCA Groups</h2>
      <ErrorAlert error={contractError} onDismiss={clearError} />
      <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
        Rotating Savings and Credit Associations — Susu / Chit Fund on Stacks.
      </p>

      {loading && (
        <div className="grid-2" style={{ marginBottom: "1rem" }}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} lines={3} height="100px" />)}
        </div>
      )}

      {/* Create ROSCA */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Create ROSCA</h3>
        <div className="grid-2">
          <div className="form-group">
            <label>Name</label>
            <input value={rName.value} onChange={rName.onChange} onBlur={rName.onBlur} placeholder="Friday Savers" />
            {rName.error && <span className="text-sm" style={{ color: 'var(--color-error)' }}>{rName.error}</span>}
          </div>
          <div className="form-group">
            <label>Contribution per Cycle (STX)</label>
            <input type="number" value={rContrib.value} onChange={rContrib.onChange} onBlur={rContrib.onBlur} placeholder="10.0" min="0.000001" step="0.000001" />
            {rContrib.error && <span className="text-sm" style={{ color: 'var(--color-error)' }}>{rContrib.error}</span>}
          </div>
          <div className="form-group">
            <label>Cycle Length (blocks)</label>
            <input type="number" value={rCycle.value} onChange={rCycle.onChange} onBlur={rCycle.onBlur} placeholder="1008" />
            <span className="text-muted" style={{ fontSize: "0.75rem" }}>≈ {Math.round(parseInt(rCycle.value || "0") / 144)} days</span>
          </div>
          <div className="form-group">
            <label>Max Members</label>
            <input type="number" value={rMax.value} onChange={rMax.onChange} onBlur={rMax.onBlur} min="2" max="20" />
          </div>
        </div>
        <button
          className="btn-primary"
          aria-busy={txPending}
          aria-label="Create new ROSCA group"
          disabled={txPending || !rName.value || !rContrib.value}
          onClick={() =>
            handle(
              () => createRosca(rName.value, Math.floor(parseFloat(rContrib.value) * 1_000_000), parseInt(rCycle.value), parseInt(rMax.value)),
              "ROSCA created"
            )
          }
        >
          {txPending ? <span className="spinner" /> : "Create ROSCA"}
        </button>
      </div>

      {/* ROSCA actions by ID */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>ROSCA Actions</h3>
        <div className="form-group">
          <label>ROSCA ID</label>
          <input type="number" value={actRoscaId.value} onChange={actRoscaId.onChange} onBlur={actRoscaId.onBlur} placeholder="1" />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn-secondary" aria-busy={txPending} aria-label="Join ROSCA" disabled={txPending || !actRoscaId.value} onClick={() => handle(() => joinRosca(parseInt(actRoscaId.value)), "Joined ROSCA")}>Join</button>
          <button className="btn-secondary" aria-busy={txPending} aria-label="Lock and start ROSCA" disabled={txPending || !actRoscaId.value} onClick={() => handle(() => lockAndStart(parseInt(actRoscaId.value)), "ROSCA started")}>Lock & Start</button>
          <button className="btn-primary" aria-busy={txPending} aria-label="Contribute to ROSCA" disabled={txPending || !actRoscaId.value} onClick={() => handle(() => contribute(parseInt(actRoscaId.value)), "Contribution sent")}>Contribute</button>
          <button className="btn-secondary" aria-busy={txPending} aria-label="Trigger payout" disabled={txPending || !actRoscaId.value} onClick={() => handle(() => payout(parseInt(actRoscaId.value)), "Payout triggered")}>Trigger Payout</button>
        </div>

        {/* Set payout order */}
        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
          <label className="text-sm text-muted" style={{ display: "block", marginBottom: "0.4rem" }}>
            Set Payout Order (comma-separated principals, admin only)
          </label>
          <input
            value={orderList.value}
            onChange={orderList.onChange}
            onBlur={orderList.onBlur}
            placeholder="ST1…, ST2…, ST3…"
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <button
            className="btn-secondary"
            aria-busy={txPending}
            aria-label="Set payout order"
            disabled={txPending || !actRoscaId.value || !orderList.value}
            onClick={() => {
              const principals = orderList.value.split(",").map((p: string) => p.trim()).filter(Boolean);
              handle(() => setPayoutOrder(parseInt(actRoscaId.value), principals), "Payout order set");
            }}
          >
            Set Order
          </button>
        </div>
      </div>

      {/* ROSCA list */}
      <h3 style={{ marginBottom: "0.75rem" }}>Active Groups ({roscas.length})</h3>
      {!loading && roscas.length === 0 && <p className="text-muted">No ROSCA groups found. Create one above.</p>}
      <div className="grid-3">
        {roscas.map((r) => (
          <div className="card" key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <h4 style={{ margin: 0 }}>{r.name}</h4>
              <span
                className="badge"
                style={{ background: statusColor[r.status?.toLowerCase()] ?? "#64748b", color: "#0a0a0a", fontSize: "0.68rem" }}
              >
                {r.status}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              <div><span className="text-muted" style={{ fontSize: "0.72rem" }}>Contribution</span><br /><strong>{stx(r.contributionAmount)} STX</strong></div>
              <div><span className="text-muted" style={{ fontSize: "0.72rem" }}>Members</span><br /><strong>{r.memberCount}/{r.maxMembers}</strong></div>
              <div><span className="text-muted" style={{ fontSize: "0.72rem" }}>Cycle</span><br /><strong>{r.currentCycle}/{r.totalCycles}</strong></div>
              <div><span className="text-muted" style={{ fontSize: "0.72rem" }}>Cycle (blocks)</span><br /><strong>{r.cycleBlocks}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
