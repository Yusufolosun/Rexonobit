// frontend/src/components/TreasuryPanel.tsx
// Circle treasury: deposit, propose spend, vote, execute

import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import {
  depositToTreasury,
  proposeSpend,
  voteOnProposal,
  executeSpend,
} from "../lib/transactions";
import {
  getTreasuryBalance,
  getTreasuryProposal,
  getTotalCircles,
} from "../lib/read";

interface Proposal {
  id: number;
  circleId: number;
  proposer: string;
  recipient: string;
  amount: number;
  description: string;
  yesVotes: number;
  noVotes: number;
  status: string;
  executableAt: number;
}

interface TreasuryBalance {
  circleId: number;
  balance: number;
}

export default function TreasuryPanel() {
  const { address, connected } = useWallet();
  const [balances, setBalances] = useState<TreasuryBalance[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Deposit form
  const [depCircle, setDepCircle] = useState("");
  const [depAmt, setDepAmt] = useState("");

  // Propose form
  const [propCircle, setPropCircle] = useState("");
  const [propRecipient, setPropRecipient] = useState("");
  const [propAmt, setPropAmt] = useState("");
  const [propDesc, setPropDesc] = useState("");

  // Vote / execute
  const [voteId, setVoteId] = useState("");
  const [execId, setExecId] = useState("");

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const total = await getTotalCircles().catch(() => 0);
      const bals: TreasuryBalance[] = [];
      for (let i = 1; i <= Math.min(Number(total), 20); i++) {
        const b = await getTreasuryBalance(i).catch(() => 0);
        if (Number(b) > 0) bals.push({ circleId: i, balance: Number(b) });
      }
      setBalances(bals);

      const props: Proposal[] = [];
      for (let i = 1; i <= 20; i++) {
        const p = await getTreasuryProposal(i).catch(() => null);
        if (p) props.push(p as Proposal);
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
      <section id="treasury" className="page-container">
        <div className="card alert alert-info">Connect wallet to access treasury.</div>
      </section>
    );
  }

  const stx = (v: number) => (v / 1_000_000).toFixed(4);
  const trunc = (addr: string) => addr ? `${addr.slice(0, 8)}…${addr.slice(-4)}` : "—";

  const statusColor: Record<string, string> = {
    pending: "#f59e0b",
    approved: "#10b981",
    executed: "#3b82f6",
    rejected: "#ef4444",
  };

  return (
    <section id="treasury" className="page-container">
      <h2 className="section-title">Treasury</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading && <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}><span className="spinner" /> Loading…</div>}

      {/* Balances */}
      {balances.length > 0 && (
        <>
          <h3 style={{ marginBottom: "0.75rem" }}>Circle Treasuries</h3>
          <div className="grid-3" style={{ marginBottom: "2rem" }}>
            {balances.map((b) => (
              <div className="card" key={b.circleId}>
                <span className="text-muted text-sm">Circle #{b.circleId}</span>
                <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{stx(b.balance)} <span className="text-muted" style={{ fontSize: "0.78rem" }}>STX</span></div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        {/* Deposit */}
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Deposit to Treasury</h3>
          <div className="form-group">
            <label>Circle ID</label>
            <input type="number" value={depCircle} onChange={(e) => setDepCircle(e.target.value)} placeholder="1" />
          </div>
          <div className="form-group">
            <label>Amount (STX)</label>
            <input type="number" value={depAmt} onChange={(e) => setDepAmt(e.target.value)} placeholder="0.0" min="0.000001" step="0.000001" />
          </div>
          <button
            className="btn-secondary"
            disabled={txPending || !depCircle || !depAmt}
            onClick={() => handle(() => depositToTreasury(parseInt(depCircle), Math.floor(parseFloat(depAmt) * 1_000_000)), "Deposit sent")}
          >
            {txPending ? <span className="spinner" /> : "Deposit"}
          </button>
        </div>

        {/* Propose Spend */}
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Propose Spend</h3>
          <div className="form-group">
            <label>Circle ID</label>
            <input type="number" value={propCircle} onChange={(e) => setPropCircle(e.target.value)} placeholder="1" />
          </div>
          <div className="form-group">
            <label>Recipient</label>
            <input value={propRecipient} onChange={(e) => setPropRecipient(e.target.value)} placeholder="ST1PQHQ…" />
          </div>
          <div className="form-group">
            <label>Amount (STX)</label>
            <input type="number" value={propAmt} onChange={(e) => setPropAmt(e.target.value)} placeholder="0.0" min="0.000001" step="0.000001" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={propDesc} onChange={(e) => setPropDesc(e.target.value)} placeholder="Community event fund…" />
          </div>
          <button
            className="btn-primary"
            disabled={txPending || !propCircle || !propRecipient || !propAmt}
            onClick={() =>
              handle(
                () => proposeSpend(parseInt(propCircle), propRecipient, Math.floor(parseFloat(propAmt) * 1_000_000), propDesc),
                "Proposal created"
              )
            }
          >
            {txPending ? <span className="spinner" /> : "Create Proposal"}
          </button>
        </div>
      </div>

      {/* Vote / Execute */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Vote & Execute</h3>
        <div className="grid-2">
          <div>
            <div className="form-group">
              <label>Proposal ID</label>
              <input type="number" value={voteId} onChange={(e) => setVoteId(e.target.value)} placeholder="1" />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn-primary" disabled={txPending || !voteId} style={{ flex: 1 }}
                onClick={() => handle(() => voteOnProposal(parseInt(voteId), true), "Vote YES cast")}>
                Vote YES
              </button>
              <button className="btn-secondary" disabled={txPending || !voteId} style={{ flex: 1 }}
                onClick={() => handle(() => voteOnProposal(parseInt(voteId), false), "Vote NO cast")}>
                Vote NO
              </button>
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Proposal ID to Execute</label>
              <input type="number" value={execId} onChange={(e) => setExecId(e.target.value)} placeholder="1" />
            </div>
            <button
              className="btn-primary"
              disabled={txPending || !execId}
              style={{ width: "100%" }}
              onClick={() => handle(() => executeSpend(parseInt(execId)), "Spend executed")}
            >
              {txPending ? <span className="spinner" /> : "Execute Spend"}
            </button>
          </div>
        </div>
      </div>

      {/* Proposals list */}
      <h3 style={{ marginBottom: "0.75rem" }}>Proposals ({proposals.length})</h3>
      {!loading && proposals.length === 0 && <p className="text-muted">No proposals yet.</p>}
      <div className="grid-2">
        {proposals.map((p) => (
          <div className="card" key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ fontWeight: 700 }}>#{p.id} {p.description}</span>
              <span className="badge" style={{ background: statusColor[p.status?.toLowerCase()] ?? "#64748b", color: "#0a0a0a", fontSize: "0.68rem" }}>
                {p.status}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.3rem", fontSize: "0.78rem" }}>
              <div><span className="text-muted">Amount</span><br /><strong>{stx(p.amount)} STX</strong></div>
              <div><span className="text-muted">Yes / No</span><br /><strong>{p.yesVotes} / {p.noVotes}</strong></div>
              <div><span className="text-muted">Recipient</span><br /><strong title={p.recipient}>{trunc(p.recipient)}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
