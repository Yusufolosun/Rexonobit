/**
 * @module useRosca
 * @description React hook for ROSCA (Rotating Savings and Credit Association)
 * circle data. Fetches circle info and membership status for a given Stacks
 * address via the rosca contract.
 */
import { useState, useEffect, useCallback } from 'react';
import { getRosca } from '../lib/read';
import type { RoscaStatus } from '../lib/types';

export interface RoscaData {
  id: number;
  circleId: number;
  contributionAmount: number;
  cycleLengthBlocks: number;
  currentCycle: number;
  totalCycles: number;
  status: number;
  currentPot: number;
  startBlock: number;
  payoutOrder: string[];
}

export interface UseRoscaResult {
  rosca: RoscaData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRosca(roscaId: number | null): UseRoscaResult {
  const [rosca, setRosca] = useState<RoscaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!roscaId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRosca(roscaId);
      if (data) {
        setRosca({
          id: roscaId,
          circleId: data['circle-id'] ?? 0,
          contributionAmount: data['contribution-amount'] ?? 0,
          cycleLengthBlocks: data['cycle-length-blocks'] ?? 0,
          currentCycle: data['current-cycle'] ?? 0,
          totalCycles: data['total-cycles'] ?? 0,
          status: data.status ?? 0,
          currentPot: data['current-pot'] ?? 0,
          startBlock: data['start-block'] ?? 0,
          payoutOrder: data['payout-order'] ?? [],
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch ROSCA');
    } finally {
      setLoading(false);
    }
  }, [roscaId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { rosca, loading, error, refresh: fetch };
}
