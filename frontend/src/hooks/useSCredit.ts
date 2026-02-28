import { useState, useEffect, useCallback } from 'react';
import { getSCreditBalance, getCreditLimit } from '../lib/read';

export interface SCreditState {
  balance: number;
  creditLimit: number;
  utilizationPct: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSCredit(address: string | null): SCreditState {
  const [balance, setBalance] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const [bal, limit] = await Promise.all([
        getSCreditBalance(address),
        getCreditLimit(address),
      ]);
      setBalance(bal);
      setCreditLimit(limit);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch sCREDIT data');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const utilizationPct = creditLimit > 0 ? Math.min(100, (balance / creditLimit) * 100) : 0;

  return { balance, creditLimit, utilizationPct, loading, error, refresh: fetch };
}
