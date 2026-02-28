# NotificationsContext

**Location:** `frontend/src/context/NotificationsContext.tsx`

Provides app-wide in-memory notification state — add, dismiss, and mark-read without any external library.

---

## Types

### `NotificationSeverity`

```ts
type NotificationSeverity = "info" | "success" | "warning" | "error";
```

### `AppNotification`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID-style unique ID |
| `message` | `string` | Human-readable text |
| `severity` | `NotificationSeverity` | Visual importance level |
| `timestamp` | `string` | ISO-8601 creation time |
| `read` | `boolean` | Whether the notification has been acknowledged |

---

## Context Value

| Field / Method | Type | Description |
|----------------|------|-------------|
| `notifications` | `AppNotification[]` | All notifications, newest first |
| `unreadCount` | `number` | Count of unread items |
| `addNotification` | `(message: string, severity?: NotificationSeverity) => void` | Push a new notification |
| `dismiss` | `(id: string) => void` | Remove a specific notification by ID |
| `dismissAll` | `() => void` | Clear all notifications |
| `markAllRead` | `() => void` | Mark every notification as read |

---

## Usage

### Wrap the app

```tsx
// main.tsx
import { NotificationsProvider } from "@/context/NotificationsContext";

<NotificationsProvider>
  <App />
</NotificationsProvider>
```

### Consume in a component

```tsx
import { useNotifications } from "@/context/NotificationsContext";

function NotificationBell() {
  const { unreadCount, notifications, markAllRead, dismiss } = useNotifications();

  return (
    <>
      <button onClick={markAllRead} aria-label={`${unreadCount} unread notifications`}>
        🔔 {unreadCount > 0 && <span>{unreadCount}</span>}
      </button>
      {notifications.map(n => (
        <div key={n.id} className={`badge-${n.severity}`}>
          {n.message}
          <button onClick={() => dismiss(n.id)}>✕</button>
        </div>
      ))}
    </>
  );
}
```

### Add a notification from any hook or component

```tsx
const { addNotification } = useNotifications();

// On loan repayment success:
addNotification("Loan repaid successfully!", "success");

// On contract error:
addNotification(parseContractError(err), "error");
```

---

## Integration with parseError

```ts
import { parseContractError } from "@/lib/parseError";
import { useNotifications } from "@/context/NotificationsContext";

const { addNotification } = useNotifications();

try {
  await callContract();
} catch (err) {
  addNotification(parseContractError(String(err)), "error");
}
```

---

## Notes

- Notifications are stored in React state only — they are **not persisted** to localStorage.
- Notification IDs are generated with `crypto.randomUUID()` (supported in all modern browsers).
- List is ordered newest-first (prepend on add).
