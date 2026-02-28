// frontend/src/context/NotificationsContext.tsx
// Global notification state: add, dismiss, dismiss-all

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  /** ISO-8601 timestamp set automatically on creation */
  timestamp: string;
  read: boolean;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (message: string, severity?: NotificationSeverity) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  markAllRead: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  dismiss: () => {},
  dismissAll: () => {},
  markAllRead: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback(
    (message: string, severity: NotificationSeverity = "info") => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setNotifications((prev) => [
        {
          id,
          message,
          severity,
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        dismiss,
        dismissAll,
        markAllRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Access the notifications context. Must be used inside <NotificationsProvider>. */
export function useNotifications(): NotificationsContextType {
  return useContext(NotificationsContext);
}

export default NotificationsContext;
