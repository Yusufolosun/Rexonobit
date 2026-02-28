// frontend/src/components/CircleList.tsx
// Browse all circles, register member, create circle, join/vouch

import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import CircleCard, { Circle } from "./CircleCard";
import { SkeletonCard } from "./SkeletonCard";
import { useWindowFocus } from "../hooks/useWindowFocus";
import {
  registerMember,
  createCircle,
  requestJoin,
  vouchFor,
} from "../lib/transactions";
import {
  isMember as checkMember,
  getCircle,
  getTotalCircles,
} from "../lib/read";
import { useToast } from "../context/ToastContext";

export default function CircleList() {
  const { address, connected } = useWallet();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [memberStatus, setMemberStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  // New circle form
  const [circleName, setCircleName] = useState("");
  const [circleDesc, setCircleDesc] = useState("");
  const [minTrust, setMinTrust] = useState("100");
  const [maxMembers, setMaxMembers] = useState("20");

  // Vouch form
  const [vouchTarget, setVouchTarget] = useState("");
  const [vouchCircle, setVouchCircle] = useState("");

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const total = await getTotalCircles().catch(() => 0);
      const memberOk = await checkMember(address).catch(() => false);
      setMemberStatus(Boolean(memberOk));

      const fetched: Circle[] = [];
      for (let i = 1; i <= Math.min(Number(total), 50); i++) {
        try {
          const c = await getCircle(i);
          if (c) fetched.push(c as Circle);
        } catch {
          // skip
        }
      }
      setCircles(fetched);
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
      toastSuccess(`${msg} submitted`, res.txid);
      setTimeout(refresh, 4000);
    } catch (e) {
      toastError(String(e));
    } finally {
      setTxPending(false);
    }
  };

  if (!connected) {
    return (
      <section id="circles" className="page-container">
        <div className="card alert alert-info">Connect wallet to browse cooperative circles.</div>
      </section>
    );
  }

  return (
    <section id="circles" className="page-container" aria-labelledby="circles-title">
      <h2 id="circles-title" className="section-title">Cooperative Circles</h2>

      {/* Register as member */}
      {!memberStatus && (
        <div className="card" style={{ marginBottom: "1.5rem", borderColor: "var(--color-primary)" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>Join the Protocol</h3>
          <p className="text-muted text-sm" style={{ marginBottom: "0.75rem" }}>
            Register as a REXONOBIT member to access circles, savings vault, loans, and more.
          </p>
          <button
            className="btn-primary"
            disabled={txPending}
            onClick={() => handle(() => registerMember(), "Registration submitted")}
          >
            {txPending ? <span className="spinner" /> : "Register as Member"}
          </button>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: "2rem" }}>
        {/* Create circle */}
        {memberStatus && (
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Create a Circle</h3>
            <div className="form-group">
              <label>Circle Name</label>
              <input value={circleName} onChange={(e) => setCircleName(e.target.value)} placeholder="Lagos Savers Club" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={circleDesc} onChange={(e) => setCircleDesc(e.target.value)} placeholder="A circle for…" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Min Trust Score</label>
                <input type="number" value={minTrust} onChange={(e) => setMinTrust(e.target.value)} min="0" max="1000" />
              </div>
              <div className="form-group">
                <label>Max Members</label>
                <input type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} min="2" max="100" />
              </div>
            </div>
            <button
              className="btn-primary"
              disabled={txPending || !circleName}
              onClick={() =>
                handle(
                  () => createCircle(circleName, circleDesc, parseInt(minTrust), parseInt(maxMembers)),
                  "Circle created"
                )
              }
            >
              {txPending ? <span className="spinner" /> : "Create Circle"}
            </button>
          </div>
        )}

        {/* Vouch for member */}
        {memberStatus && (
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Vouch for a Member</h3>
            <div className="form-group">
              <label>Member Principal</label>
              <input value={vouchTarget} onChange={(e) => setVouchTarget(e.target.value)} placeholder="ST1PQHQ…" />
            </div>
            <div className="form-group">
              <label>Circle ID</label>
              <input type="number" value={vouchCircle} onChange={(e) => setVouchCircle(e.target.value)} placeholder="1" />
            </div>
            <button
              className="btn-secondary"
              disabled={txPending || !vouchTarget || !vouchCircle}
              onClick={() => handle(() => vouchFor(parseInt(vouchCircle), vouchTarget), "Vouch submitted")}
            >
              {txPending ? <span className="spinner" /> : "Vouch"}
            </button>
          </div>
        )}
      </div>

      {/* Circle grid */}
      <h3 style={{ marginBottom: "1rem" }}>All Circles ({circles.length})</h3>
      {loading && (
        <div className="grid-3">
          {[1,2,3].map(i => <SkeletonCard key={i} lines={4} height="140px" />)}
        </div>
      )}
      {!loading && circles.length === 0 && (
        <p className="text-muted">No circles found. Be the first to create one.</p>
      )}
      <div className="grid-3">
        {circles.map((c) => (
          <CircleCard
            key={c.id}
            circle={c}
            isMember={memberStatus}
            currentAddress={address ?? undefined}
            txPending={txPending}
            onJoin={(id) => handle(() => requestJoin(id), "Join request sent")}
            onVouch={(id) => {
              const target = prompt("Enter member principal to vouch:");
              if (target) handle(() => vouchFor(id, target), "Vouch submitted");
            }}
          />
        ))}
      </div>
    </section>
  );
}
