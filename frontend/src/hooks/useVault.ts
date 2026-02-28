import { useState, useEffect, useCallback } from 'react';
import {
  getVaultBalance,
  getLockedBalance,
  getLockedUntil,
  getStreakStatus,
} from '../lib/read';

export interface VaultState {
  balance: number;
  lockedBalance: number;
  lockedUntil: number;
  streakActive: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useVault(address: string | null): VaultState {
  const [balance, setBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [streakActive, setStreakActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const [bal, locked, until, streak] = await Promise.all([
        getVaultBalance(address),
        getLockedBalance(address),
        getLockedUntil(address),
        getStreakStatus(address),
      ]);
      setBalance(bal);
      setLockedBalance(locked);
      setLockedUntil(until);
      setStreakActive(streak);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch vault data');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { balance, lockedBalance, lockedUntil, streakActive, loading, error, refresh: fetch };
}
