/**
 * @module useSCredit
 * @description React hook for sCREDIT synthetic credit line state.
 * Fetches balance, credit limit, utilization %, trust score, and locked
 * savings collateral for a given Stacks address.
 */
import { useState, useEffect, useCallback } from 'react';
import { getSCreditBalance, getCreditLimit, getTrustScore, getLockedBalance } from '../lib/read';
import type { SCreditPosition } from '../lib/types';

export interface SCreditState {
  balance: number;
  creditLimit: number;
  utilizationPct: number;
  trustScore: number;
  lockedSavings: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSCredit(address: string | null): SCreditState {
  const [balance, setBalance] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [trustScore, setTrustScore] = useState(0);
  const [lockedSavings, setLockedSavings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const [bal, limit, score, locked] = await Promise.all([
        getSCreditBalance(address),
        getCreditLimit(address),
        getTrustScore(address),
        getLockedBalance(address),
      ]);
      setBalance(bal);
      setCreditLimit(limit);
      setTrustScore(score);
      setLockedSavings(locked);
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

  return { balance, creditLimit, utilizationPct, trustScore, lockedSavings, loading, error, refresh: fetch };
}
