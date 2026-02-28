# TxHistory

Displays a paginated list of the connected wallet's recent Stacks transactions, filtered to REXONOBIT protocol contract calls.

## Import

```tsx
import { TxHistory } from "@/components/TxHistory";
// or
import TxHistory from "@/components/TxHistory";
```

## Props

No props — reads the connected address from `WalletContext`.

## Displayed Columns

| Column        | Description                                  |
| ------------- | -------------------------------------------- |
| Function      | On-chain function name called                |
| Contract      | Short contract name (e.g. `lending-pool`)    |
| Status        | `Success` / `Failed` / `Pending`             |
| Time          | Relative timestamp (`2m ago`, `3h ago`, etc.)|
| Fee           | Transaction fee in STX                       |
| Link          | Explorer link to the full transaction        |

## Status Colours

| Status    | Colour variable     |
| --------- | ------------------- |
| `success` | `--color-success`   |
| `failed`  | `--color-error`     |
| `pending` | `--color-warning`   |

## Features

- **Pagination**: shows 10 transactions per page with previous/next controls.
- **Filtering**: only shows transactions to known REXONOBIT contract names.
- **Auto-refresh**: uses `useWindowFocus` to refetch when the tab regains focus.
- **Loading skeleton**: renders `SkeletonRow` items while fetching.

## Data Source

Fetches from `STACKS_API_URL/extended/v1/address/{address}/transactions` (Hiro Stacks API).

## Example

```tsx
import { TxHistory } from "@/components/TxHistory";

<section>
  <h2>Transaction History</h2>
  <TxHistory />
</section>
```

## Dependencies

- `WalletContext` — `address`, `connected`
- `useWindowFocus` — auto-refetch
- `lib/explorer.explorerTxUrl` — transaction link
- `lib/network.STACKS_API_URL` — API base URL
