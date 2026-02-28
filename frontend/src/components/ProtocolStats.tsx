// frontend/src/components/ProtocolStats.tsx
// Protocol-wide aggregate statistics panel

/**
 * ProtocolStats — protocol-level aggregate metrics.
 * Displays total members, active circles, lending pool balance,
 * and treasury balance. Refreshes on mount and window focus.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext";
import { getTotalMembers, getTotalCircles, getPoolBalance, getTreasuryBalance } from "../lib/read";
import { useWindowFocus } from "../hooks/useWindowFocus";
import { microstxToStx } from "../lib/constants";

interface ProtocolStatsState {
  totalMembers: number;
  totalCircles: number;
  poolBalance: number;  // in STX
  treasuryBalance: number;  // in STX
}

const defaultStats: ProtocolStatsState = {
  totalMembers: 0,
  totalCircles: 0,
  poolBalance: 0,
  treasuryBalance: 0,
};

const StatCard: React.FC<{ label: string; value: string | number; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <div className="stat-card" style={{ background: "var(--bg-panel)", borderRadius: 12, padding: "1rem 1.5rem", textAlign: "center" }}>
    <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--accent)" }}>{value}</div>
    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
  </div>
);

export const ProtocolStats: React.FC = () => {
  const { address } = useWallet();
  const [stats, setStats] = useState<ProtocolStatsState>(defaultStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const [members, circles, pool, treasury] = await Promise.all([
        getTotalMembers(address),
        getTotalCircles(address),
        getPoolBalance(address, 1),
        getTreasuryBalance(address),
      ]);
      setStats({
        totalMembers: members ?? 0,
        totalCircles: circles ?? 0,
        poolBalance: microstxToStx(pool ?? 0),
        treasuryBalance: microstxToStx(treasury ?? 0),
      });
    } catch (e) {
      setError("Failed to load protocol statistics.");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);
  useWindowFocus(refresh);

  const cards = [
    { label: "Total Members", value: stats.totalMembers },
    { label: "Active Circles", value: stats.totalCircles },
    { label: "Lending Pool", value: `${stats.poolBalance.toLocaleString()} STX`, sub: "locked collateral" },
    { label: "Treasury", value: `${stats.treasuryBalance.toLocaleString()} STX`, sub: "protocol fees" },
  ];

  return (
    <section aria-labelledby="protocol-stats-title" style={{ marginBottom: "2rem" }}>
      <h2 id="protocol-stats-title" style={{ marginBottom: "1rem" }}>Protocol Statistics</h2>

      {loading && (
        <div role="status" aria-live="polite" style={{ color: "var(--text-muted)", marginBottom: 12 }}>
          Loading protocol statistics…
        </div>
      )}

      {error && (
        <div className="alert-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>
      )}

      <div
        className="grid-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} sub={(c as any).sub} />
        ))}
      </div>
    </section>
  );
};

export default ProtocolStats;
