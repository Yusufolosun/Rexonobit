/**
 * @module useLoan
 * @description React hook for REXONOBIT lending-pool loan state.
 * Fetches the active loan for a given Stacks address from the lending-pool
 * contract. Exposes a refresh callback for manual invalidation.
 */
import { useState, useEffect, useCallback } from 'react';
import { getLoan } from '../lib/read';
import type { LoanStatus } from '../lib/types';

export interface LoanData {
  id: number;
  borrower: string;
  circleId: number;
  amount: number;
  repaid: number;
  dueBlock: number;
  /** Numeric status code; use LoanStatus label for display. */
  status: number;
  /** Derived human-readable status label. */
  statusLabel: LoanStatus | "unknown";
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
      const raw = await getLoan(loanId);
      const data = raw as Record<string, unknown> | null;
      if (data) {
        const statusNum = Number(data.status ?? 0);
        const statusLabel: LoanStatus | "unknown" =
          statusNum === 1 ? "active" :
          statusNum === 2 ? "repaid" :
          statusNum === 3 ? "defaulted" : "unknown";
        setLoan({
          id: loanId,
          borrower: (data.borrower as string) ?? '',
          circleId: Number(data['circle-id'] ?? 0),
          amount: Number(data.amount ?? 0),
          repaid: Number(data.repaid ?? 0),
          dueBlock: Number(data['due-block'] ?? 0),
          status: statusNum,
          statusLabel,
          requestedAt: Number(data['requested-at'] ?? 0),
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
