import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '../context/WalletContext';
import { STACKS_API_URL } from '../lib/network';
import { explorerTxUrl } from '../lib/explorer';
import { SkeletonRow } from './SkeletonCard';

interface TxRecord {
  txId: string;
  functionName: string;
  contractName: string;
  status: 'success' | 'failed' | 'pending';
  blockTime: number;
  fee: number;
}

const STATUS_COLOR = {
  success: 'var(--color-success)',
  failed:  'var(--color-error)',
  pending: 'var(--color-warning)',
};

const STATUS_LABEL = {
  success: 'Success',
  failed:  'Failed',
  pending: 'Pending',
};

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '—';
  const diff = Math.floor((Date.now() / 1000) - timestamp);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

async function fetchTxHistory(address: string): Promise<TxRecord[]> {
  const apiBase = STACKS_API_URL;
  try {
    const resp = await fetch(`${apiBase}/extended/v2/addresses/${address}/transactions?limit=30&type[]=contract_call`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.results ?? []).map((item: Record<string, unknown>) => {
      const tx = item.tx as Record<string, unknown>;
      const cc = (tx?.contract_call ?? {}) as Record<string, unknown>;
      const contractId = (cc?.contract_id ?? '') as string;
      return {
        txId: (tx?.tx_id ?? '') as string,
        functionName: (cc?.function_name ?? 'unknown') as string,
        contractName: contractId.includes('.') ? contractId.split('.')[1] : contractId,
        status: (tx?.tx_status === 'success' ? 'success' : tx?.tx_status === 'pending' ? 'pending' : 'failed') as TxRecord['status'],
        blockTime: (tx?.block_time_iso ? Math.floor(new Date(tx.block_time_iso as string).getTime() / 1000) : 0),
        fee: parseInt(((tx?.fee_rate ?? '0') as string), 10),
      };
    });
  } catch {
    return [];
  }
}

export function TxHistory() {
  const { address, connected } = useWallet();
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await fetchTxHistory(address);
      setTxs(data);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!connected || !address) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p className="text-muted">Connect wallet to view transaction history.</p>
      </div>
    );
  }

  const filtered = useMemo(
    () => filter === 'all' ? txs : txs.filter(t => t.status === filter),
    [txs, filter]
  );

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Transaction History</h2>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['all', 'success', 'failed'] as const).map(f => (
            <button
              key={f}
              className={filter === f ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter(f)}
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
          <button className="btn-secondary" onClick={refresh} style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>↻</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '2rem 0' }}>
          No transactions found.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>Function</th>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>Contract</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }}>Time</th>
                <th style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600 }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.txId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{tx.functionName}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>{tx.contractName}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <span style={{
                      color: STATUS_COLOR[tx.status],
                      fontWeight: 600,
                      fontSize: '0.78rem',
                    }}>
                      {STATUS_LABEL[tx.status]}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                    {formatRelativeTime(tx.blockTime)}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    <a
                      href={explorerTxUrl(tx.txId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem' }}
                    >
                      View →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
