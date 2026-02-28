# CircleList

A full-page panel for browsing cooperative circles, registering as a member, creating new circles, joining existing ones, and vouching for other members.

## Import

```tsx
import CircleList from "@/components/CircleList";
```

## Props

This component takes **no props**. All state is derived from `WalletContext` and Stacks contract reads.

## Features

| Feature             | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| Browse circles      | Fetches all circles via `getTotalCircles` + `getCircle`           |
| Register member     | Calls `registerMember` from `lib/transactions`                    |
| Create circle       | Form with name, description, min trust score, max members         |
| Join circle         | Calls `requestJoin` for any circle not at capacity                |
| Vouch for member    | Input the target address and circle ID, calls `vouchFor`          |
| Auto-refresh        | Uses `useWindowFocus` to refetch when the tab regains focus       |
| Loading skeleton    | Displays `SkeletonCard` while fetching                            |

## Form Inputs

### Create Circle

| Field         | Validation       | Default |
| ------------- | ---------------- | ------- |
| Name          | Required         | —       |
| Description   | Optional         | `""`    |
| Min Trust     | Numeric ≥ 0      | `100`   |
| Max Members   | Numeric 2–50     | `20`    |

### Vouch Member

| Field         | Validation                  |
| ------------- | --------------------------- |
| Target address | Valid STX principal        |
| Circle ID     | Numeric                     |

## Dependencies

- `WalletContext` — address, connected
- `ToastContext` — success / error notifications
- `CircleCard` — renders each circle
- `useWindowFocus` — automatic refetch on focus

## Notes

- Requires the connected wallet to be a registered member before creating a circle.
- One active vouch per address per circle is enforced on-chain.
