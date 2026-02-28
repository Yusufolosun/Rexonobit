# Navbar

The primary navigation bar shown at the top of the application. Includes protocol navigation links, wallet connect/disconnect, and a theme toggle.

## Import

```tsx
import Navbar from "@/components/Navbar";
```

## Props

No props — all state comes from `WalletContext`.

## Navigation Links

| Label      | Hash href    |
| ---------- | ------------ |
| Dashboard  | `#dashboard` |
| Circles    | `#circles`   |
| Vault      | `#vault`     |
| Loans      | `#loans`     |
| ROSCA      | `#rosca`     |
| Tasks      | `#tasks`     |
| Treasury   | `#treasury`  |
| Governance | `#governance`|

## Features

- **Sticky positioning**: `position: sticky; top: 0` keeps it visible while scrolling.
- **Wallet button**: Shows truncated address (`SP1AB…EF78`) when connected; shows "Connect Wallet" when not.
- **ThemeToggle**: Inline dark/light mode switcher at the right end of the bar.
- **Accessibility**: `role="navigation"` and `aria-label="Main navigation"` on the `<nav>` element.

## Wallet Truncation

Addresses are displayed as `{first 6 chars}…{last 4 chars}`, e.g. `SP1ABX…EF78`.

## Example Usage

```tsx
// In App.tsx
import Navbar from "@/components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <main>{/* panels */}</main>
    </>
  );
}
```

## Dependencies

- `WalletContext` — `address`, `connected`, `connect`, `disconnect`
- `ThemeToggle` — dark/light toggle button
