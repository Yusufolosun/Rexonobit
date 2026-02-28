// frontend/src/hooks/usePagination.ts
// Client-side pagination hook — slices an array into pages

import { useState, useMemo, useCallback } from "react";

interface PaginationResult<T> {
  /** Items on the current page */
  page: T[];
  /** Current page index (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a previous page */
  hasPrev: boolean;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Navigate to a specific page (1-based) */
  goToPage: (page: number) => void;
  /** Navigate to the next page */
  nextPage: () => void;
  /** Navigate to the previous page */
  prevPage: () => void;
  /** Reset to page 1 */
  reset: () => void;
}

/**
 * Paginates an array client-side. Useful for task lists, loan history, etc.
 *
 * @param items      Full array of items
 * @param pageSize   Number of items per page (default 10)
 *
 * @example
 * const { page, currentPage, totalPages, nextPage, prevPage } = usePagination(tasks, 5);
 */
export function usePagination<T>(items: T[], pageSize = 10): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize]
  );

  const page = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = useCallback(
    (p: number) => setCurrentPage(Math.min(totalPages, Math.max(1, p))),
    [totalPages]
  );

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const reset = useCallback(() => setCurrentPage(1), []);

  return {
    page,
    currentPage,
    totalPages,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
    goToPage,
    nextPage,
    prevPage,
    reset,
  };
}
