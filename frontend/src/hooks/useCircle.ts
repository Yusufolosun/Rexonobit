/**
 * @module useCircle
 * @description React hook for REXONOBIT cooperative-registry circle data.
 * Fetches circle info for a given circle ID from the cooperative-registry
 * contract.
 */
import { useState, useEffect, useCallback } from 'react';
import { getCircle } from '../lib/read';

export interface CircleData {
  id: number;
  name: string;
  admin: string;
  memberCount: number;
  maxSize: number;
  status: number;
  circleType: number;
  totalSaved: number;
  createdAt: number;
}

export interface UseCircleResult {
  circle: CircleData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCircle(circleId: number | null): UseCircleResult {
  const [circle, setCircle] = useState<CircleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!circleId) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await getCircle(circleId);
      const data = raw as Record<string, unknown> | null;
      if (data) {
        setCircle({
          id: circleId,
          name: (data.name as string) ?? '',
          admin: (data.admin as string) ?? '',
          memberCount: Number(data['member-count'] ?? 0),
          maxSize: Number(data['max-size'] ?? 0),
          status: Number(data.status ?? 0),
          circleType: Number(data['circle-type'] ?? 0),
          totalSaved: Number(data['total-saved'] ?? 0),
          createdAt: Number(data['created-at'] ?? 0),
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch circle');
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { circle, loading, error, refresh: fetch };
}
