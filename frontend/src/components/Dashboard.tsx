// frontend/src/components/Dashboard.tsx
// Protocol overview: member stats, trust score, vault balance, active loans

import React, { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext";
import {
  getTrustScore,
  getVaultBalance,
  getLockedBalance,
  getStreakStatus,
  getMaxLoanAmount,
  getTotalMembers,
  getTotalCircles,
  isMember,
} from "../lib/read";
import { SkeletonCard } from "./SkeletonCard";

interface Stats {
  trustScore: number;
  vaultBalance: number;
  lockedBalance: number;
  streak: number;
  maxLoan: number;
  isMember: boolean;
  totalMembers: number;
  totalCircles: number;
}

function StatCard({ label, value, unit = "" }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <span className="text-sm text-muted">{label}</span>
      <span style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
        {value}
        {unit && <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginLeft: "0.3rem" }}>{unit}</span>}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { address, connected } = useWallet();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);

    Promise.all([
      getTrustScore(address).catch(() => 0),
      getVaultBalance(address).catch(() => 0),
      getLockedBalance(address).catch(() => 0),
      getStreakStatus(address).catch(() => 0),
      getMaxLoanAmount(address).catch(() => 0),
      isMember(address).catch(() => false),
      getTotalMembers().catch(() => 0),
      getTotalCircles().catch(() => 0),
    ])
      .then(([trustScore, vaultBalance, lockedBalance, streak, maxLoan, memberStatus, totalMembers, totalCircles]) => {
        setStats({
          trustScore: Number(trustScore),
          vaultBalance: Number(vaultBalance),
          lockedBalance: Number(lockedBalance),
          streak: Number(streak),
          maxLoan: Number(maxLoan),
          isMember: Boolean(memberStatus),
          totalMembers: Number(totalMembers),
          totalCircles: Number(totalCircles),
        });
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [address]);

  if (!connected) {
    return (
      <section id="dashboard" className="page-container">
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>◈</div>
          <h2 style={{ marginBottom: "0.5rem" }}>Bitcoin-Native Micro-Economy</h2>
          <p className="text-muted" style={{ marginBottom: "1.5rem", maxWidth: 480, margin: "0 auto 1.5rem" }}>
            Connect your Hiro Wallet to access savings vaults, circle lending, ROSCA groups, and on-chain governance.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="dashboard" className="page-container">
      <h2 className="section-title">Dashboard</h2>

      {loading && (
        <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} lines={1} height="80px" />)}
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <>
          <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
            <StatCard label="Trust Score" value={stats.trustScore} unit="/ 1000" />
            <StatCard label="Vault Balance" value={(stats.vaultBalance / 1_000_000).toFixed(4)} unit="STX" />
            <StatCard label="Locked Savings" value={(stats.lockedBalance / 1_000_000).toFixed(4)} unit="STX" />
            <StatCard label="Deposit Streak" value={stats.streak} unit="cycles" />
            <StatCard label="Max Loan" value={(stats.maxLoan / 1_000_000).toFixed(2)} unit="STX" />
            <StatCard label="Member Status" value={stats.isMember ? "Active" : "Not Registered"} />
          </div>

          <div className="grid-2">
            <StatCard label="Protocol Members" value={stats.totalMembers} />
            <StatCard label="Active Circles" value={stats.totalCircles} />
          </div>
        </>
      )}
    </section>
  );
}
