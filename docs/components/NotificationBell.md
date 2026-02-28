# NotificationBell

`src/components/NotificationBell.tsx`

Bell icon button that shows an unread-count badge and expands a dropdown list of recent notifications.  Designed to sit in the `Navbar`.

---

## Types

```ts
interface Notification {
  id: string;
  message: string;
  timestamp: string;  // ISO date string
  read: boolean;
}
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `notifications` | `Notification[]` | — | Ordered list of notifications (latest first recommended) |
| `onDismiss` | `(id: string) => void` | — | Called when the user clicks × on a single item |
| `onDismissAll` | `() => void` | — | Called when the user clicks "Clear all" |

---

## Usage

```tsx
import { NotificationBell } from "../components/NotificationBell";

const [notifications, setNotifications] = useState<Notification[]>([]);

function addNotification(message: string) {
  setNotifications((prev) => [
    { id: crypto.randomUUID(), message, timestamp: new Date().toISOString(), read: false },
    ...prev,
  ]);
}

function dismiss(id: string) {
  setNotifications((prev) => prev.filter((n) => n.id !== id));
}

<NotificationBell
  notifications={notifications}
  onDismiss={dismiss}
  onDismissAll={() => setNotifications([])}
/>
```

---

## Accessibility

- The bell button has `aria-haspopup="true"` and `aria-expanded={open}`.
- `aria-label` is `"{n} unread notifications"` when there are unread items, otherwise `"Notifications"`.
- The unread badge is `aria-hidden="true"` (the count is conveyed through the button label).
- Dropdown closes on **Escape** keypress and outside clicks.
- Each dismiss button has `aria-label="Dismiss notification: {message}"`.
- Notification timestamps use the `<time>` element with `dateTime` attribute.

---

## Dropdown behaviour

| Trigger | Result |
|---------|--------|
| Click bell button | Toggle dropdown open/closed |
| Click outside dropdown | Close dropdown |
| Press `Escape` | Close dropdown |
| Click × on item | Call `onDismiss(id)` |
| Click "Clear all" | Call `onDismissAll()` |

---

## Integration Example

```tsx
// Navbar.tsx
import { NotificationBell } from "./NotificationBell";
import { useNotifications } from "../context/NotificationsContext";

const { notifications, dismiss, dismissAll } = useNotifications();

<NotificationBell
  notifications={notifications}
  onDismiss={dismiss}
  onDismissAll={dismissAll}
/>
```
