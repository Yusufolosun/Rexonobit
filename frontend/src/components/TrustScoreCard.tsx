// frontend/src/components/TrustScoreCard.tsx
// Displays member trust score with full component breakdown

import React, { useEffect, useState } from "react";
import { getTrustScoreFull } from "../lib/read";
import { SkeletonCard } from "./SkeletonCard";

interface TrustData {
  score: number;
  savingsPoints: number;
  loanPoints: number;
  endorsementPoints: number;
  laborPoints: number;
  penaltyPoints: number;
}

interface Props {
  address: string;
}

const BAR_MAX = 1000;

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ background: "var(--color-surface)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.6s ease" }} />
    </div>
  );
}

export default function TrustScoreCard({ address }: Props) {
  const [data, setData] = useState<TrustData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    getTrustScoreFull(address)
      .then((d: TrustData) => setData(d))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [address]);

  const tier = (score: number) => {
    if (score >= 900) return { label: "Platinum", color: "#e2e8f0" };
    if (score >= 700) return { label: "Gold", color: "#f7931a" };
    if (score >= 500) return { label: "Silver", color: "#94a3b8" };
    if (score >= 300) return { label: "Bronze", color: "#b45309" };
    return { label: "Starter", color: "#64748b" };
  };

  if (loading) return <SkeletonCard lines={6} height="220px" />;
  if (error) return <div className="card alert alert-error">{error}</div>;
  if (!data) return null;

  const { label: tierLabel, color: tierColor } = tier(data.score);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <span className="text-sm text-muted" style={{ display: "block" }}>Trust Score</span>
          <span style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.04em" }}>{data.score}</span>
          <span className="text-muted" style={{ fontSize: "0.85rem" }}>&nbsp;/ 1000</span>
        </div>
        <span className={`badge badge-primary`} style={{ background: tierColor, color: "#0a0a0a", fontWeight: 700 }}>{tierLabel}</span>
      </div>

      <ScoreBar value={data.score} max={BAR_MAX} color="var(--color-primary)" />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "1.25rem" }}>
        {[
          { label: "Savings", value: data.savingsPoints, color: "#10b981" },
          { label: "Loan Repayments", value: data.loanPoints, color: "#3b82f6" },
          { label: "Endorsements", value: data.endorsementPoints, color: "#8b5cf6" },
          { label: "Labor", value: data.laborPoints, color: "#f59e0b" },
          { label: "Penalties", value: data.penaltyPoints, color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm" style={{ fontWeight: 600 }}>{value}</span>
            </div>
            <ScoreBar value={value} max={300} color={color} />
          </div>
        ))}
      </div>
    </div>
  );
}
