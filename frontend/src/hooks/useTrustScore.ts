/**
 * @module useTrustScore
 * @description React hook for REXONOBIT trust score state.
 * Fetches decomposed trust score (savings, loan, endorsement, labor, penalty)
 * for a given Stacks address via the trust-score contract.
 */
import { useState, useEffect, useCallback } from 'react';
import { getTrustScoreFull } from '../lib/read';
import type { TrustTier } from '../lib/types';

export interface TrustScoreBreakdown {
  total: number;
  savings: number;
  loan: number;
  endorsement: number;
  labor: number;
  penalty: number;
  /** Derived tier from total score. */
  tier: TrustTier;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTrustScore(address: string | null): TrustScoreBreakdown {
  const [total, setTotal] = useState(0);
  const [savings, setSavings] = useState(0);
  const [loan, setLoan] = useState(0);
  const [endorsement, setEndorsement] = useState(0);
  const [labor, setLabor] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await getTrustScoreFull(address);
      const data = raw as Record<string, number> | null;
      if (data) {
        setTotal(data.total ?? 0);
        setSavings(data.savings ?? 0);
        setLoan(data.loan ?? 0);
        setEndorsement(data.endorsement ?? 0);
        setLabor(data.labor ?? 0);
        setPenalty(data.penalty ?? 0);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch trust score');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const tier: TrustTier =
    total >= 900 ? "platinum" :
    total >= 700 ? "gold" :
    total >= 500 ? "silver" :
    total >= 300 ? "bronze" : "none";

  return { total, savings, loan, endorsement, labor, penalty, tier, loading, error, refresh: fetch };
}
