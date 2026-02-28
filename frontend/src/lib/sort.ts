// frontend/src/lib/sort.ts
// Sorting utilities for domain objects used across the REXONOBIT protocol UI

/**
 * @module sort
 * @description Pure, composable sort helpers for arrays of protocol domain
 * objects.  All functions are non-mutating — they return new sorted arrays.
 *
 * Usage:
 *   import { sortByTrustScore, sortByDate, sortCirclesByBalance } from "@/lib/sort";
 */

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

type SortOrder = "asc" | "desc";

/**
 * Returns a numeric comparator for a numeric property.
 */
function byNumber<T>(key: keyof T, order: SortOrder = "desc") {
  return (a: T, b: T): number => {
    const diff = (a[key] as unknown as number) - (b[key] as unknown as number);
    return order === "desc" ? -diff : diff;
  };
}

/**
 * Returns a string comparator for a string property.
 */
function byString<T>(key: keyof T, order: SortOrder = "asc") {
  return (a: T, b: T): number => {
    const av = String(a[key]);
    const bv = String(b[key]);
    const cmp = av.localeCompare(bv);
    return order === "asc" ? cmp : -cmp;
  };
}

// ---------------------------------------------------------------------------
// Trust score sorting
// ---------------------------------------------------------------------------

export interface HasTrustScore {
  score: number;
}

/**
 * Sorts an array of objects that have a numeric `score` property.
 * Defaults to descending (highest score first).
 *
 * @example
 * const ranked = sortByTrustScore(members); // highest first
 */
export function sortByTrustScore<T extends HasTrustScore>(
  items: T[],
  order: SortOrder = "desc"
): T[] {
  return [...items].sort(byNumber<T>("score" as keyof T, order));
}

// ---------------------------------------------------------------------------
// Date / block-height sorting
// ---------------------------------------------------------------------------

export interface HasTimestamp {
  /** ISO-8601 timestamp string  */
  timestamp: string;
}

/**
 * Sorts objects with an ISO-8601 `timestamp` string.
 * Defaults to descending (newest first).
 *
 * @example
 * const latest = sortByDate(notifications); // newest first
 */
export function sortByDate<T extends HasTimestamp>(
  items: T[],
  order: SortOrder = "desc"
): T[] {
  return [...items].sort((a, b) => {
    const diff = Date.parse(a.timestamp) - Date.parse(b.timestamp);
    return order === "desc" ? -diff : diff;
  });
}

export interface HasBlockHeight {
  blockHeight: number;
}

/**
 * Sorts objects by on-chain `blockHeight`.
 * Defaults to descending (most recent block first).
 */
export function sortByBlockHeight<T extends HasBlockHeight>(
  items: T[],
  order: SortOrder = "desc"
): T[] {
  return [...items].sort(byNumber<T>("blockHeight" as keyof T, order));
}

// ---------------------------------------------------------------------------
// Circle sorting
// ---------------------------------------------------------------------------

export interface CircleSummary {
  circleId: number;
  name: string;
  balance: number;
  memberCount: number;
}

/**
 * Sorts circles by STX balance.
 * Defaults to descending (richest circle first).
 */
export function sortCirclesByBalance(
  circles: CircleSummary[],
  order: SortOrder = "desc"
): CircleSummary[] {
  return [...circles].sort(byNumber<CircleSummary>("balance", order));
}

/**
 * Sorts circles alphabetically by name.
 */
export function sortCirclesByName(
  circles: CircleSummary[],
  order: SortOrder = "asc"
): CircleSummary[] {
  return [...circles].sort(byString<CircleSummary>("name", order));
}

/**
 * Sorts circles by member count.
 * Defaults to descending (largest circle first).
 */
export function sortCirclesByMemberCount(
  circles: CircleSummary[],
  order: SortOrder = "desc"
): CircleSummary[] {
  return [...circles].sort(byNumber<CircleSummary>("memberCount", order));
}

// ---------------------------------------------------------------------------
// Loan sorting
// ---------------------------------------------------------------------------

export interface LoanSummary {
  loanId: number;
  amount: number;
  dueBlock: number;
  status: string;
}

/**
 * Sorts loans by due block (ascending = most urgent first).
 */
export function sortLoansByDueBlock(
  loans: LoanSummary[],
  order: SortOrder = "asc"
): LoanSummary[] {
  return [...loans].sort(byNumber<LoanSummary>("dueBlock", order));
}

/**
 * Sorts loans by amount.
 * Defaults to descending (largest loan first).
 */
export function sortLoansByAmount(
  loans: LoanSummary[],
  order: SortOrder = "desc"
): LoanSummary[] {
  return [...loans].sort(byNumber<LoanSummary>("amount", order));
}
