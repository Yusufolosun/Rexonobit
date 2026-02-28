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
      const data = await getCircle(circleId);
      if (data) {
        setCircle({
          id: circleId,
          name: data.name ?? '',
          admin: data.admin ?? '',
          memberCount: data['member-count'] ?? 0,
          maxSize: data['max-size'] ?? 0,
          status: data.status ?? 0,
          circleType: data['circle-type'] ?? 0,
          totalSaved: data['total-saved'] ?? 0,
          createdAt: data['created-at'] ?? 0,
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
