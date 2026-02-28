import React from "react";

interface PaginationBarProps {
  /** Current page number (1-based). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Called when the user navigates to a new page. */
  onPageChange: (page: number) => void;
  /** Number of page-number links to show in the middle. Defaults to 5. */
  windowSize?: number;
  /** Additional CSS class names for the nav element. */
  className?: string;
}

/**
 * Returns a windowed list of page numbers with ellipsis gaps.
 */
function buildPageList(current: number, total: number, window: number): (number | "…")[] {
  if (total <= window) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(window / 2);
  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  if (current - half < 2) end = Math.min(total - 1, window - 1);
  if (current + half > total - 1) start = Math.max(2, total - window + 1);

  const pages: (number | "…")[] = [1];
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);

  return pages;
}

/**
 * PaginationBar
 *
 * Renders previous/next controls and numbered page buttons with ellipsis
 * for large page sets. Fully keyboard navigable.
 *
 * @example
 * <PaginationBar page={3} totalPages={10} onPageChange={setPage} />
 */
const PaginationBar: React.FC<PaginationBarProps> = ({
  page,
  totalPages,
  onPageChange,
  windowSize = 5,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages, windowSize);

  const btnBase: React.CSSProperties = {
    minWidth: "2rem",
    height: "2rem",
    padding: "0 0.5rem",
    border: "1px solid var(--border)",
    borderRadius: "5px",
    background: "var(--bg)",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontSize: "0.875rem",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s ease, border-color 0.15s ease",
  };

  const activeStyle: React.CSSProperties = {
    ...btnBase,
    background: "var(--accent, #6366f1)",
    borderColor: "var(--accent, #6366f1)",
    color: "#fff",
    fontWeight: 600,
  };

  const disabledStyle: React.CSSProperties = {
    ...btnBase,
    opacity: 0.4,
    cursor: "not-allowed",
  };

  return (
    <nav
      aria-label="Pagination"
      role="navigation"
      className={`pagination-bar ${className}`}
      style={{ display: "flex", alignItems: "center", gap: "0.325rem", flexWrap: "wrap" }}
    >
      {/* Previous */}
      <button
        style={page === 1 ? disabledStyle : btnBase}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === "…" ? (
          <span
            key={`ellipsis-${idx}`}
            aria-hidden="true"
            style={{ padding: "0 0.25rem", color: "var(--text-secondary)" }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            style={p === page ? activeStyle : btnBase}
            onClick={() => onPageChange(p as number)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        style={page === totalPages ? disabledStyle : btnBase}
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
};

export default PaginationBar;
