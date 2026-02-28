// frontend/src/components/TaskBoard.tsx
// On-chain gig board: post task, bid, accept bid, submit, attest, dispute

import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import {
  postTask,
  bidTask,
  acceptBid,
  submitCompletion,
  attestTask,
  disputeTask,
  cancelTask,
} from "../lib/transactions";
import { getTask, getTotalTasks } from "../lib/read";
import { useFormField } from "../hooks/useFormField";
import { validateSTX, validatePositiveInt, validateTaskTitle, validateTaskDescription, validatePrincipal } from "../lib/validators";
import { FormInput, FormTextarea } from "./FormInput";

interface Task {
  id: number;
  poster: string;
  worker: string | null;
  title: string;
  description: string;
  bounty: number;
  status: string;
  attestations: number;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#10b981",
  assigned: "#3b82f6",
  review: "#f59e0b",
  complete: "#6366f1",
  disputed: "#ef4444",
  cancelled: "#64748b",
};

export default function TaskBoard() {
  const { address, connected } = useWallet();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Post task form with validation
  const taskTitle = useFormField("", validateTaskTitle);
  const taskDesc = useFormField("", validateTaskDescription);
  const taskBounty = useFormField("", validateSTX);

  // Action forms with validation
  const taskId = useFormField("", (v) => validatePositiveInt(v, "Task ID"));
  const bidAmt = useFormField("", validateSTX);
  const workerAddr = useFormField("", validatePrincipal);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const total = await getTotalTasks().catch(() => 0);
      const list: Task[] = [];
      for (let i = 1; i <= Math.min(Number(total), 30); i++) {
        const t = await getTask(i).catch(() => null);
        if (t) list.push(t as Task);
      }
      setTasks(list.reverse());
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
      <section id="tasks" className="page-container">
        <div className="card alert alert-info">Connect wallet to access the labor market.</div>
      </section>
    );
  }

  const stx = (v: number) => (v / 1_000_000).toFixed(4);
  const trunc = (addr: string) => addr ? `${addr.slice(0, 8)}…${addr.slice(-4)}` : "—";

  return (
    <section id="tasks" className="page-container">
      <h2 className="section-title">Labor Market</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Post Task */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Post a Task</h3>
        <div className="grid-2">
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Task Title</label>
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Build a landing page" />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Description</label>
            <input value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="I need…" />
          </div>
          <div className="form-group">
            <label>Bounty (STX)</label>
            <input type="number" value={taskBounty} onChange={(e) => setTaskBounty(e.target.value)} placeholder="5.0" min="0.000001" step="0.000001" />
          </div>
        </div>
        <button
          className="btn-primary"
          disabled={txPending || !taskTitle || !taskBounty}
          onClick={() =>
            handle(
              () => postTask(taskTitle, taskDesc, Math.floor(parseFloat(taskBounty) * 1_000_000)),
              "Task posted"
            )
          }
        >
          {txPending ? <span className="spinner" /> : "Post Task"}
        </button>
      </div>

      {/* Task Actions Panel */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Task Actions</h3>
        <div className="form-group">
          <label>Task ID</label>
          <input type="number" value={taskId} onChange={(e) => setTaskId(e.target.value)} placeholder="1" />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Bid Amount (STX, for bidding)</label>
            <input type="number" value={bidAmt} onChange={(e) => setBidAmt(e.target.value)} placeholder="4.5" min="0" step="0.000001" />
          </div>
          <div className="form-group">
            <label>Worker Address (for accept-bid)</label>
            <input value={workerAddr} onChange={(e) => setWorkerAddr(e.target.value)} placeholder="ST1PQHQ…" />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn-secondary" disabled={txPending || !taskId || !bidAmt}
            onClick={() => handle(() => bidTask(parseInt(taskId), Math.floor(parseFloat(bidAmt) * 1_000_000)), "Bid submitted")}>
            Bid
          </button>
          <button className="btn-secondary" disabled={txPending || !taskId || !workerAddr}
            onClick={() => handle(() => acceptBid(parseInt(taskId), workerAddr), "Bid accepted")}>
            Accept Bid
          </button>
          <button className="btn-primary" disabled={txPending || !taskId}
            onClick={() => handle(() => submitCompletion(parseInt(taskId)), "Completion submitted")}>
            Submit Completion
          </button>
          <button className="btn-primary" disabled={txPending || !taskId}
            onClick={() => handle(() => attestTask(parseInt(taskId), true), "Attested ✓")}>
            Attest ✓
          </button>
          <button className="btn-secondary" disabled={txPending || !taskId}
            onClick={() => handle(() => attestTask(parseInt(taskId), false), "Attest rejected")}>
            Reject
          </button>
          <button className="btn-secondary" disabled={txPending || !taskId}
            onClick={() => handle(() => disputeTask(parseInt(taskId)), "Dispute opened")}>
            Open Dispute
          </button>
          <button className="btn-secondary" disabled={txPending || !taskId}
            onClick={() => handle(() => cancelTask(parseInt(taskId)), "Task cancelled")}>
            Cancel
          </button>
        </div>
      </div>

      {/* Task List */}
      <h3 style={{ marginBottom: "0.75rem" }}>
        Recent Tasks ({tasks.length})
        {loading && <span className="spinner" style={{ marginLeft: "0.5rem" }} />}
      </h3>
      {!loading && tasks.length === 0 && <p className="text-muted">No tasks found. Post the first one!</p>}
      <div className="grid-2">
        {tasks.map((t) => (
          <div className="card" key={t.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ fontWeight: 700 }}>#{t.id} {t.title}</span>
              <span
                className="badge"
                style={{ background: STATUS_COLORS[t.status?.toLowerCase()] ?? "#64748b", color: "#0a0a0a", fontSize: "0.68rem" }}
              >
                {t.status}
              </span>
            </div>
            {t.description && <p className="text-muted text-sm" style={{ marginBottom: "0.5rem" }}>{t.description}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.3rem", fontSize: "0.78rem" }}>
              <div><span className="text-muted">Bounty</span><br /><strong>{stx(t.bounty)} STX</strong></div>
              <div><span className="text-muted">Poster</span><br /><strong title={t.poster}>{trunc(t.poster)}</strong></div>
              <div><span className="text-muted">Attestations</span><br /><strong>{t.attestations}/2</strong></div>
            </div>
            {t.worker && (
              <div style={{ marginTop: "0.4rem", fontSize: "0.78rem" }}>
                <span className="text-muted">Worker: </span><strong title={t.worker}>{trunc(t.worker)}</strong>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
