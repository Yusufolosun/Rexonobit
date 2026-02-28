# wallet

**File:** `frontend/src/lib/wallet.ts`

## Purpose

Stacks wallet integration using `@stacks/connect`. Provides `connectWallet`, `disconnectWallet`, and session helpers consumed by the wallet context. Never stores or handles private key material — all signing happens inside the user's Hiro Wallet extension.

## Exports

### `userSession: UserSession`

Singleton `UserSession` configured with `store_write` and `publish_data` scopes. Shared across all hooks and the wallet context.

```ts
export const userSession = new UserSession({ appConfig });
```

### `connectWallet(onFinish?: () => void): void`

Triggers the Hiro Wallet connection flow via `showConnect`.

- Reads app name and icon from `VITE_APP_NAME` and `VITE_APP_ICON_URL`.
- Calls `onFinish` when the user approves.
- Logs and ignores user cancellation.

### `disconnectWallet(): void`

Calls `userSession.signUserOut()` and reloads the page to clear all session state.

### `getConnectedAddress(): string | null`

Returns the connected user's Stacks address, or `null` if not connected.

```ts
const address = getConnectedAddress();
if (!address) return null;
```

### `isWalletConnected(): boolean`

Returns `true` if a valid session exists.

## Environment Variables

| Variable | Default | Description |
|----------|---------|------------|
| `VITE_APP_NAME` | `"Rexonobit"` | App name shown in wallet popup |
| `VITE_APP_ICON_URL` | `"/icon.png"` | App icon shown in wallet popup |

## Usage

```ts
import { connectWallet, getConnectedAddress, isWalletConnected } from '../lib/wallet';

if (!isWalletConnected()) {
  connectWallet(() => console.log('connected'));
}
const address = getConnectedAddress();
```

## Notes

- Do not call `connectWallet` inside a React render — use it in an event handler (`onClick`).
- `userSession` is imported directly by `transactions.ts` to provide the signing address.
- Works exclusively with the Hiro Wallet browser extension.
