// frontend/src/lib/format.ts
// Human-readable formatting utilities for STX amounts, addresses, dates, and percentages

/**
 * @module format
 * @description Pure formatting helpers for display purposes.
 * All functions are stateless, accept primitives, and return formatted strings.
 * Use these instead of inline `toFixed` / `toLocaleString` calls in components.
 */

const MICROSTX_PER_STX = 1_000_000;

/**
 * Convert microSTX to a human-readable STX string.
 * @example formatMicroSTX(5_500_000) → "5.50 STX"
 */
export function formatMicroSTX(microSTX: number, decimals = 2): string {
  const stx = microSTX / MICROSTX_PER_STX;
  return `${stx.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} STX`;
}

/**
 * Convert microSTX to a compact STX string with suffix (K/M).
 * @example formatMicroSTXCompact(5_500_000_000) → "5.5K STX"
 */
export function formatMicroSTXCompact(microSTX: number): string {
  const stx = microSTX / MICROSTX_PER_STX;
  if (stx >= 1_000_000) return `${(stx / 1_000_000).toFixed(2)}M STX`;
  if (stx >= 1_000) return `${(stx / 1_000).toFixed(1)}K STX`;
  return `${stx.toFixed(2)} STX`;
}

/**
 * Shorten a Stacks principal address for display.
 * @example truncateAddress("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM") → "ST1P...PGZGM"
 */
export function truncateAddress(address: string, startChars = 6, endChars = 6): string {
  if (!address || address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a block height as a human-readable string.
 * @example formatBlockHeight(123456) → "Block #123,456"
 */
export function formatBlockHeight(height: number): string {
  return `Block #${height.toLocaleString("en-US")}`;
}

/**
 * Format a Unix timestamp (seconds) as a localized date string.
 * @example formatTimestamp(1700000000) → "Nov 14, 2023"
 */
export function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a percentage value with a % suffix.
 * @example formatPercent(67.5) → "67.5%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format an integer count with thousands separators.
 * @example formatCount(12345) → "12,345"
 */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
