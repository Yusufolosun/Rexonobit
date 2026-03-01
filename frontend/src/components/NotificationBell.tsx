import { useState, useRef, useEffect } from "react";


// ---------------------------------------------------------------------------
// NotificationBell — pending-transaction count badge with dropdown
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  message: string;
  /** ISO timestamp string */
  timestamp: string;
  /** Whether user has seen/dismissed this notification */
  read: boolean;
}

interface NotificationBellProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
  onDismissAll?: () => void;
}

/**
 * NotificationBell renders a bell icon with an unread-count badge.
 * Clicking the bell opens a dropdown listing recent notifications.
 * Designed to be placed in the Navbar.
 *
 * @example
 * <NotificationBell notifications={pendingTxs} onDismiss={removeTx} />
 */
export function NotificationBell({
  notifications,
  onDismiss,
  onDismissAll,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.3rem",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Bell SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              minWidth: "1rem",
              height: "1rem",
              background: "var(--color-error, #ef4444)",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.65rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 0.2rem",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            right: 0,
            width: "20rem",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.6rem 0.9rem",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>Notifications</span>
            {notifications.length > 0 && onDismissAll && (
              <button
                type="button"
                onClick={onDismissAll}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p
              style={{
                padding: "1rem",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "0.82rem",
              }}
            >
              No notifications
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                maxHeight: "16rem",
                overflowY: "auto",
              }}
            >
              {notifications.map((n) => (
                <li
                  key={n.id}
                  role="menuitem"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "0.6rem 0.9rem",
                    borderBottom: "1px solid var(--color-border)",
                    background: n.read ? "transparent" : "var(--color-primary-dim, rgba(99,102,241,0.06))",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.82rem",
                        color: "var(--color-text)",
                        wordBreak: "break-word",
                      }}
                    >
                      {n.message}
                    </p>
                    <time
                      dateTime={n.timestamp}
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {new Date(n.timestamp).toLocaleTimeString()}
                    </time>
                  </div>
                  {onDismiss && (
                    <button
                      type="button"
                      aria-label={`Dismiss notification: ${n.message}`}
                      onClick={() => onDismiss(n.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-muted)",
                        padding: 0,
                        flexShrink: 0,
                        fontSize: "1rem",
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
