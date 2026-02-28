import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { STACKS_API_URL } from '../lib/network';
import { explorerAddressUrl } from '../lib/explorer';
import { SkeletonCard } from './SkeletonCard';

interface Badge {
  tokenId: number;
  badgeType: number;
  mintedAt: number;
}

const BADGE_META: Record<number, { label: string; description: string; color: string; icon: string }> = {
  1: { label: 'First Save',      description: 'Made first vault deposit',          color: '#f7931a', icon: '🏦' },
  2: { label: 'Loan Repaid',     description: 'Fully repaid a micro-loan',         color: '#22c55e', icon: '✅' },
  3: { label: 'Circle Founder',  description: 'Created a cooperative circle',      color: '#6b48ff', icon: '⭕' },
  4: { label: 'ROSCA Champion',  description: 'Completed a full ROSCA cycle',      color: '#f59e0b', icon: '🔄' },
  5: { label: 'Labor Star',      description: 'Completed 5 on-chain tasks',        color: '#06b6d4', icon: '⭐' },
  6: { label: 'Arbitrator',      description: 'Served on a dispute panel',         color: '#a78bfa', icon: '⚖️' },
  7: { label: 'Governance Hero', description: 'Voted on 3+ governance proposals',  color: '#ec4899', icon: '🏛️' },
};

async function fetchBadges(address: string): Promise<Badge[]> {
  const apiBase = STACKS_API_URL;
  try {
    const resp = await fetch(`${apiBase}/extended/v1/tokens/nft/holdings?principal=${address}&limit=50`);
    if (!resp.ok) return [];
    const data = await resp.json();
    const results: Badge[] = [];
    for (const item of data.results ?? []) {
      if (item.asset_identifier?.includes('reputation-nft')) {
        const tokenId = parseInt(item.value?.repr?.replace('u', '') ?? '0', 10);
        results.push({ tokenId, badgeType: ((tokenId - 1) % 7) + 1, mintedAt: 0 });
      }
    }
    return results;
  } catch {
    return [];
  }
}

export function BadgeGallery() {
  const { address, connected } = useWallet();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await fetchBadges(address);
      setBadges(data);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!connected || !address) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p className="text-muted">Connect wallet to view your soulbound badges.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Soulbound Badges</h2>
        <a href={explorerAddressUrl(address)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>View on Explorer ↗</a>
        <button className="btn-secondary" onClick={refresh} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid-3" style={{ gap: '0.75rem' }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={2} height="100px" />)}
        </div>
      ) : badges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</p>
          <p className="text-muted">No badges yet. Complete protocol actions to earn soulbound NFTs.</p>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: '0.75rem' }}>
          {badges.map(badge => {
            const meta = BADGE_META[badge.badgeType] ?? { label: `Badge #${badge.badgeType}`, description: '', color: '#888', icon: '🏅' };
            return (
              <div
                key={badge.tokenId}
                style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius)',
                  padding: '1rem',
                  border: `1px solid ${meta.color}44`,
                  textAlign: 'center',
                  transition: 'transform 0.15s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{meta.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: meta.color, marginBottom: '0.2rem' }}>{meta.label}</div>
                <div className="text-muted text-sm">{meta.description}</div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  Token #{badge.tokenId}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All badge types as locked/unlocked grid */}
      <div style={{ marginTop: '1.5rem' }}>
        <p className="text-muted text-sm" style={{ marginBottom: '0.75rem' }}>All achievement badges:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Object.entries(BADGE_META).map(([typeStr, meta]) => {
            const typeNum = parseInt(typeStr, 10);
            const earned = badges.some(b => b.badgeType === typeNum);
            return (
              <div
                key={typeStr}
                title={meta.description}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  border: `1px solid ${earned ? meta.color : 'var(--color-border)'}`,
                  background: earned ? `${meta.color}22` : 'transparent',
                  fontSize: '0.8rem',
                  color: earned ? meta.color : 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  opacity: earned ? 1 : 0.5,
                }}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
