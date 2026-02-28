// frontend/src/components/TrustScoreCard.tsx
// Displays member trust score with full component breakdown

import React from "react";
import { useTrustScore } from "../hooks/useTrustScore";
import { SkeletonCard } from "./SkeletonCard";

interface Props {
  address: string;
}

const BAR_MAX = 1000;

function ScoreBar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label ? `${label}: ${value} of ${max}` : undefined}
      style={{ background: "var(--color-surface)", borderRadius: "4px", height: "8px", overflow: "hidden" }}
    >
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.6s ease" }} />
    </div>
  );
}

export default function TrustScoreCard({ address }: Props) {
  const { total, savings, loan, endorsement, labor, penalty, loading, error } = useTrustScore(address);

  const tier = (score: number) => {
    if (score >= 900) return { label: "Platinum", color: "#e2e8f0" };
    if (score >= 700) return { label: "Gold", color: "#f7931a" };
    if (score >= 500) return { label: "Silver", color: "#94a3b8" };
    if (score >= 300) return { label: "Bronze", color: "#b45309" };
    return { label: "Starter", color: "#64748b" };
  };

  if (loading) return <SkeletonCard lines={6} height="220px" />;
  if (error) return <div className="card alert alert-error">{error}</div>;

  const { label: tierLabel, color: tierColor } = tier(total);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <span className="text-sm text-muted" style={{ display: "block" }}>Trust Score</span>
          <span style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.04em" }} aria-label={`Trust score: ${total} out of 1000`}>{total}</span>
          <span className="text-muted" style={{ fontSize: "0.85rem" }}>&nbsp;/ 1000</span>
        </div>
        <span className={`badge badge-primary`} style={{ background: tierColor, color: "#0a0a0a", fontWeight: 700 }} aria-label={`Trust tier: ${tierLabel}`}>{tierLabel}</span>
      </div>

      <ScoreBar value={total} max={BAR_MAX} color="var(--color-primary)" label="Total trust score" />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "1.25rem" }}>
        {[
          { label: "Savings", value: savings, color: "#10b981" },
          { label: "Loan Repayments", value: loan, color: "#3b82f6" },
          { label: "Endorsements", value: endorsement, color: "#8b5cf6" },
          { label: "Labor", value: labor, color: "#f59e0b" },
          { label: "Penalties", value: penalty, color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm" style={{ fontWeight: 600 }}>{value}</span>
            </div>
            <ScoreBar value={value} max={300} color={color} label={label} />
          </div>
        ))}
      </div>
    </div>
  );
}
