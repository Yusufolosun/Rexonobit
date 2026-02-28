# CircleCard

Displays a single cooperative circle with its status, membership stats, and action buttons for joining or vouching.

## Import

```tsx
import CircleCard, { type Circle } from "@/components/CircleCard";
```

## Props

| Prop             | Type                              | Required | Description                                      |
| ---------------- | --------------------------------- | -------- | ------------------------------------------------ |
| `circle`         | `Circle`                          | Yes      | Circle data object                               |
| `isMember`       | `boolean`                         | Yes      | Whether the current user is already a member     |
| `onJoin`         | `(circleId: number) => void`      | No       | Called when user clicks "Request to Join"        |
| `onVouch`        | `(circleId: number) => void`      | No       | Called when member clicks "Vouch Member"         |
| `txPending`      | `boolean`                         | No       | Disables buttons and shows spinner while `true`  |
| `currentAddress` | `string`                          | No       | Connected wallet address (shows ADMIN badge)     |

## `Circle` Interface

```ts
interface Circle {
  id: number;
  name: string;
  admin: string;
  memberCount: number;
  status: "active" | "suspended" | "dissolved";
  minTrustScore: number;
  maxMembers: number;
  description: string;
}
```

## Status Colours

| Status      | Colour  |
| ----------- | ------- |
| `active`    | #10b981 |
| `suspended` | #f59e0b |
| `dissolved` | #ef4444 |

## Accessibility

- Outer wrapper has `role="article"` and `aria-label="{name} cooperative circle, {status}"`.
- Buttons include `aria-busy={txPending}` and descriptive `aria-label` attributes.
- Full circle status is visible in badge.

## Example

```tsx
<CircleCard
  circle={circle}
  isMember={false}
  onJoin={(id) => requestJoin(id)}
  txPending={pending}
  currentAddress={address}
/>
```
