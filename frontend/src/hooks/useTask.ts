/**
 * @module useTask
 * @description React hook for REXONOBIT labor-market task data.
 * Fetches task info for a given task ID from the labor-market contract.
 */
import { useState, useEffect, useCallback } from 'react';
import { getTask } from '../lib/read';

export interface TaskData {
  id: number;
  poster: string;
  worker: string | null;
  title: string;
  description: string;
  bounty: number;
  status: number;
  circleId: number;
  attestations: number;
  postedAt: number;
}

export interface UseTaskResult {
  task: TaskData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTask(taskId: number | null): UseTaskResult {
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await getTask(taskId);
      const data = raw as Record<string, unknown> | null;
      if (data) {
        setTask({
          id: taskId,
          poster: (data.poster as string) ?? '',
          worker: (data.worker as string) ?? null,
          title: (data.title as string) ?? '',
          description: (data.description as string) ?? '',
          bounty: Number(data.bounty ?? 0),
          status: Number(data.status ?? 0),
          circleId: Number(data['circle-id'] ?? 0),
          attestations: Number(data.attestations ?? 0),
          postedAt: Number(data['posted-at'] ?? 0),
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { task, loading, error, refresh: fetch };
}
