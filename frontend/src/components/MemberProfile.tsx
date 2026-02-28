import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useTrustScore } from '../hooks/useTrustScore';
import { useVault } from '../hooks/useVault';
import { useSCredit } from '../hooks/useSCredit';
import {
  getMember,
  getLoan,
  getRosca,
  getTask,
  getTotalCircles,
  getTotalTasks,
} from '../lib/read';
import { SkeletonCard } from './SkeletonCard';
import { explorerAddressUrl } from '../lib/explorer';

interface ActiveLoan {
  id: number;
  amount: number;
  repaid: number;
  status: number;
}

interface ActiveRosca {
  id: number;
  circleId: number;
  currentCycle: number;
  totalCycles: number;
  status: number;
}

interface ActiveTask {
  id: number;
  title: string;
  bounty: number;
  status: number;
}

const TIER_LABELS: Record<number, string> = {
  900: 'Platinum',
  700: 'Gold',
  500: 'Silver',
  300: 'Bronze',
  0:   'Starter',
};

function getTier(score: number) {
  if (score >= 900) return 'Platinum';
  if (score >= 700) return 'Gold';
  if (score >= 500) return 'Silver';
  if (score >= 300) return 'Bronze';
  return 'Starter';
}

const TIER_COLOR: Record<string, string> = {
  Platinum: '#a8edea',
  Gold:     '#f7931a',
  Silver:   '#9ca3af',
  Bronze:   '#b45309',
  Starter:  '#6b7280',
};

export function MemberProfile() {
  const { address, connected } = useWallet();
  const ts = useTrustScore(address);
  const vault = useVault(address);
  const scredit = useSCredit(address);

  const [memberData, setMemberData] = useState<{ circleId: number; reputation: number } | null>(null);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [activeRoscas, setActiveRoscas] = useState<ActiveRosca[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const member = await getMember(address);
      if (member) {
        setMemberData({ circleId: member['circle-id'] ?? 0, reputation: member.reputation ?? 0 });
      }

      const [totalCircles, totalTasks] = await Promise.all([
        getTotalCircles(),
        getTotalTasks(),
      ]);

      // Scan loans
      const loans: ActiveLoan[] = [];
      for (let i = 1; i <= Math.min(totalTasks, 50); i++) {
        try {
          const l = await getLoan(i);
          if (l && l.borrower === address && (l.status === 1 || l.status === 2)) {
            loans.push({ id: i, amount: l.amount ?? 0, repaid: l.repaid ?? 0, status: l.status ?? 0 });
          }
        } catch { /* skip */ }
      }
      setActiveLoans(loans.slice(0, 5));

      // Scan ROSCAs
      const roscas: ActiveRosca[] = [];
      for (let i = 1; i <= Math.min(totalCircles * 2, 30); i++) {
        try {
          const r = await getRosca(i);
          if (r && r.status === 1) {
            roscas.push({
              id: i,
              circleId: r['circle-id'] ?? 0,
              currentCycle: r['current-cycle'] ?? 0,
              totalCycles: r['total-cycles'] ?? 0,
              status: r.status ?? 0,
            });
          }
        } catch { /* skip */ }
      }
      setActiveRoscas(roscas.slice(0, 5));

      // Scan tasks where I am worker
      const tasks: ActiveTask[] = [];
      for (let i = totalTasks; i >= Math.max(1, totalTasks - 40); i--) {
        try {
          const t = await getTask(i);
          if (t && t.worker === address && t.status < 3) {
            tasks.push({ id: i, title: t.title ?? `Task #${i}`, bounty: t.bounty ?? 0, status: t.status ?? 0 });
          }
        } catch { /* skip */ }
      }
      setActiveTasks(tasks.slice(0, 5));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!connected || !address) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p className="text-muted">Connect your wallet to view your profile.</p>
      </div>
    );
  }

  const tier = getTier(ts.total);
  const tierColor = TIER_COLOR[tier];

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      role="region"
      aria-label={`Member profile for ${address}`}
    >
      {/* Identity card */}
      <div className="card" style={{ borderTop: `3px solid ${tierColor}` }} role="group" aria-label="Identity and tier">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{
            width: '3rem', height: '3rem', borderRadius: '50%',
            background: `linear-gradient(135deg, ${tierColor}, var(--color-accent))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1.125rem', color: '#000', flexShrink: 0,
          }}>
            {address.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <a href={explorerAddressUrl(address)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline dotted' }}>
                {address.slice(0, 12)}...{address.slice(-6)}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.125rem', color: tierColor }}>{tier}</span>
              <span className="text-muted text-sm">Circle #{memberData?.circleId ?? '—'}</span>
            </div>
          </div>
        </div>

        <div className="grid-3" style={{ gap: '0.75rem' }}>
          <div style={{ background: 'var(--color-surface-2)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: tierColor }}>{ts.total}</div>
            <div className="text-muted text-sm">Trust Score</div>
          </div>
          <div style={{ background: 'var(--color-surface-2)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(vault.balance / 1_000_000).toFixed(2)}</div>
            <div className="text-muted text-sm">STX Saved</div>
          </div>
          <div style={{ background: 'var(--color-surface-2)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>{(scredit.balance / 1_000_000).toFixed(2)}</div>
            <div className="text-muted text-sm">sCREDIT</div>
          </div>
        </div>
      </div>

      {/* Trust breakdown */}
      <div className="card">
        <h3 className="section-title" style={{ fontSize: '1rem' }}>Trust Breakdown</h3>
        {ts.loading ? <SkeletonCard lines={5} height="140px" /> : (
          [
            { label: 'Savings', value: ts.savings, color: 'var(--color-primary)' },
            { label: 'Loan Repayment', value: ts.loan, color: 'var(--color-success)' },
            { label: 'Endorsements', value: ts.endorsement, color: 'var(--color-accent)' },
            { label: 'Labor', value: ts.labor, color: '#06b6d4' },
            { label: 'Penalties', value: ts.penalty, color: 'var(--color-error)' },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span className="text-sm">{row.label}</span>
                <span className="text-sm" style={{ color: row.color }}>{row.value}</span>
              </div>
              <div style={{ height: '4px', background: 'var(--color-surface-2)', borderRadius: '2px' }}>
                <div style={{ width: `${Math.min(100, row.value / 3)}%`, height: '100%', background: row.color, borderRadius: '2px', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Active loans */}
      <div className="card">
        <h3 className="section-title" style={{ fontSize: '1rem' }}>Active Loans</h3>
        {loading ? <SkeletonCard lines={3} height="80px" /> : activeLoans.length === 0 ? (
          <p className="text-muted text-sm">No active loans.</p>
        ) : activeLoans.map(loan => (
          <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-sm">Loan #{loan.id}</span>
            <span className="text-sm">{(loan.repaid / 1_000_000).toFixed(2)} / {(loan.amount / 1_000_000).toFixed(2)} STX</span>
          </div>
        ))}
      </div>

      {/* Active ROSCAs */}
      <div className="card">
        <h3 className="section-title" style={{ fontSize: '1rem' }}>Active ROSCAs</h3>
        {loading ? <SkeletonCard lines={3} height="80px" /> : activeRoscas.length === 0 ? (
          <p className="text-muted text-sm">No active ROSCAs.</p>
        ) : activeRoscas.map(r => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-sm">ROSCA #{r.id} (Circle #{r.circleId})</span>
            <span className="text-sm">Cycle {r.currentCycle}/{r.totalCycles}</span>
          </div>
        ))}
      </div>

      {/* Active tasks */}
      <div className="card">
        <h3 className="section-title" style={{ fontSize: '1rem' }}>My Tasks</h3>
        {loading ? <SkeletonCard lines={3} height="80px" /> : activeTasks.length === 0 ? (
          <p className="text-muted text-sm">No active tasks.</p>
        ) : activeTasks.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-sm">{t.title.length > 32 ? t.title.slice(0, 32) + '…' : t.title}</span>
            <span className="text-sm">{(t.bounty / 1_000_000).toFixed(2)} STX</span>
          </div>
        ))}
      </div>
    </div>
  );
}
