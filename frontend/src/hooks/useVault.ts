import { useState, useEffect, useCallback } from 'react';
import {
  getVault,
  getVaultBalance,
  getLockedBalance,
  getStreakStatus,
} from '../lib/read';
import type { VaultData, BlockHeight } from '../lib/types';

/**
 * @module useVault
 * @description React hook for REXONOBIT savings vault state.
 * Fetches balance, locked balance, lock expiry height, and streak count
 * for a given Stacks address. Exposes a `refresh` callback for manual
 * or focus-triggered data invalidation.
 */

/** Extends canonical VaultData with hook-managed loading/error state. */
export interface VaultState extends VaultData {
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
      const [bal, locked, vault, streakVal] = await Promise.all([
        getVaultBalance(address),
        getLockedBalance(address),
        getVault(address),
        getStreakStatus(address),
      ]);
      setBalance(bal);
      setLockedBalance(locked);
      const vaultData = vault as Record<string, unknown> | null;
      setLockedUntil(Number(vaultData?.['lock-until'] ?? 0));
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

  return { balance, lockedBalance, lockedUntil: lockedUntil as BlockHeight, streak, loading, error, refresh: fetch };
}

