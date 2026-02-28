// frontend/src/lib/datetime.ts
// Block-height and timestamp conversion utilities for REXONOBIT protocol UI

/**
 * @module datetime
 * @description Converts between Stacks block heights and human-readable
 * time strings. Stacks mainnet targets ~10 minutes per block.
 *
 * Usage:
 *   import { blocksToHuman, blockHeightToEta, timeAgo } from "@/lib/datetime";
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Average Stacks mainnet block time in seconds (10 minutes). */
export const BLOCK_TIME_SECONDS = 600;

/** Average Stacks mainnet block time in minutes. */
export const BLOCK_TIME_MINUTES = BLOCK_TIME_SECONDS / 60;

// ---------------------------------------------------------------------------
// Block height helpers
// ---------------------------------------------------------------------------

/**
 * Converts a number of blocks into a human-readable duration string.
 *
 * @example
 * blocksToHuman(144)   // "~24 hours"
 * blocksToHuman(1440)  // "~10 days"
 * blocksToHuman(6)     // "~1 hour"
 */
export function blocksToHuman(blocks: number): string {
  if (blocks <= 0) return "0 seconds";
  const totalSeconds = blocks * BLOCK_TIME_SECONDS;
  const minutes = Math.round(totalSeconds / 60);

  if (minutes < 60) return `~${minutes} minute${minutes !== 1 ? "s" : ""}`;

  const hours = Math.round(minutes / 60);
  if (hours < 48) return `~${hours} hour${hours !== 1 ? "s" : ""}`;

  const days = Math.round(hours / 24);
  if (days < 14) return `~${days} day${days !== 1 ? "s" : ""}`;

  const weeks = Math.round(days / 7);
  return `~${weeks} week${weeks !== 1 ? "s" : ""}`;
}

/**
 * Estimates the wall-clock ETA Date for a future block height.
 *
 * @param targetBlock  Future block height
 * @param currentBlock Current block height
 */
export function blockHeightToEta(targetBlock: number, currentBlock: number): Date {
  const blocksRemaining = Math.max(0, targetBlock - currentBlock);
  const msRemaining = blocksRemaining * BLOCK_TIME_SECONDS * 1000;
  return new Date(Date.now() + msRemaining);
}

/**
 * Returns the estimated number of blocks until a target block height.
 *
 * @param targetBlock  Future block height
 * @param currentBlock Current block height
 */
export function blocksUntil(targetBlock: number, currentBlock: number): number {
  return Math.max(0, targetBlock - currentBlock);
}

/**
 * Returns `true` if the target block height is in the past.
 */
export function isPast(targetBlock: number, currentBlock: number): boolean {
  return currentBlock >= targetBlock;
}

// ---------------------------------------------------------------------------
// ISO timestamp helpers
// ---------------------------------------------------------------------------

/**
 * Returns a relative time string from an ISO-8601 timestamp.
 *
 * @example
 * timeAgo("2024-01-01T12:00:00Z")  // "3 days ago"
 */
export function timeAgo(isoTimestamp: string): string {
  const diffMs = Date.now() - Date.parse(isoTimestamp);
  if (isNaN(diffMs) || diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * Formats a Unix timestamp (seconds) as a relative time string.
 * Useful for formatting `blockTime` from Stacks API responses.
 *
 * @example
 * unixTimeAgo(1700000000)  // e.g. "2 days ago"
 */
export function unixTimeAgo(unixSeconds: number): string {
  if (!unixSeconds) return "—";
  return timeAgo(new Date(unixSeconds * 1000).toISOString());
}

/**
 * Formats an ISO-8601 timestamp to a short human-readable format.
 *
 * @example
 * formatDate("2024-06-01T14:30:00Z")  // "Jun 1, 2024"
 */
export function formatDate(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
