/**
 * @module useLoan
 * @description React hook for REXONOBIT lending-pool loan state.
 * Fetches the active loan for a given Stacks address from the lending-pool
 * contract. Exposes a refresh callback for manual invalidation.
 */
import { useState, useEffect, useCallback } from 'react';
import { getLoan } from '../lib/read';

export interface LoanData {
  id: number;
  borrower: string;
  circleId: number;
  amount: number;
  repaid: number;
  dueBlock: number;
  status: number;
  requestedAt: number;
}

export interface UseLoanResult {
  loan: LoanData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLoan(loanId: number | null): UseLoanResult {
  const [loan, setLoan] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!loanId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLoan(loanId);
      if (data) {
        setLoan({
          id: loanId,
          borrower: data.borrower ?? '',
          circleId: data['circle-id'] ?? 0,
          amount: data.amount ?? 0,
          repaid: data.repaid ?? 0,
          dueBlock: data['due-block'] ?? 0,
          status: data.status ?? 0,
          requestedAt: data['requested-at'] ?? 0,
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch loan');
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { loan, loading, error, refresh: fetch };
}
