import { useState, useEffect, useCallback } from 'react';
import {
  getVaultBalance,
  getLockedBalance,
  getLockedUntil,
  getStreakStatus,
} from '../lib/read';

/**
 * @module useVault
 * @description React hook for REXONOBIT savings vault state.
 * Fetches balance, locked balance, lock expiry height, and streak count
 * for a given Stacks address. Exposes a `refresh` callback for manual
 * or focus-triggered data invalidation.
 */

export interface VaultState {
  balance: number;
  lockedBalance: number;
  lockedUntil: number;
  /** Streak count in saved cycles (0 if no active streak) */
  streak: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useVault(address: string | null): VaultState {
  const [balance, setBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const [bal, locked, until, streakVal] = await Promise.all([
        getVaultBalance(address),
        getLockedBalance(address),
        getLockedUntil(address),
        getStreakStatus(address),
      ]);
      setBalance(bal);
      setLockedBalance(locked);
      setLockedUntil(until);
      setStreak(Number(streakVal));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch vault data');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { balance, lockedBalance, lockedUntil, streak, loading, error, refresh: fetch };
}

