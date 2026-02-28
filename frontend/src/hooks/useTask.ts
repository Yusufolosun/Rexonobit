/**
 * @module useTask
 * @description React hook for REXONOBIT labor-market task data.
 * Fetches task info for a given task ID from the labor-market contract.
 */
import { useState, useEffect, useCallback } from 'react';
import { getTask } from '../lib/read';
import type { TaskStatus } from '../lib/types';

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
      const data = await getTask(taskId);
      if (data) {
        setTask({
          id: taskId,
          poster: data.poster ?? '',
          worker: data.worker ?? null,
          title: data.title ?? '',
          description: data.description ?? '',
          bounty: data.bounty ?? 0,
          status: data.status ?? 0,
          circleId: data['circle-id'] ?? 0,
          attestations: data.attestations ?? 0,
          postedAt: data['posted-at'] ?? 0,
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
