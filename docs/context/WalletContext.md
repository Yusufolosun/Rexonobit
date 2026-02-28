# WalletContext

**Location:** `frontend/src/context/WalletContext.tsx`

Provides Stacks wallet connection state to the entire application via React Context. Integrates with `@stacks/connect` for wallet authentication.

---

## Types

### `NetworkMode`

```ts
type NetworkMode = "mainnet" | "testnet" | "devnet";
```

Initialized from the Vite `__STACKS_NETWORK__` define constant (falls back to `"testnet"`).

---

## Context Value

| Field / Method | Type | Description |
|----------------|------|-------------|
| `address` | `string \| null` | Connected STX wallet address, or `null` if disconnected |
| `network` | `NetworkMode` | Current network: `"mainnet"`, `"testnet"`, or `"devnet"` |
| `isConnected` | `boolean` | `true` when `address` is non-null |
| `connect` | `() => void` | Opens Hiro Wallet connection modal via `@stacks/connect` |
| `disconnect` | `() => void` | Clears wallet session and address state |
| `setNetwork` | `(mode: NetworkMode) => void` | Switches the active network |

---

## Usage

### Wrap the app

```tsx
// main.tsx
import { WalletProvider } from "@/context/WalletContext";

<WalletProvider>
  <App />
</WalletProvider>
```

### Consume in a component

```tsx
import { useWallet } from "@/context/WalletContext";

function ConnectButton() {
  const { address, isConnected, connect, disconnect } = useWallet();

  if (isConnected) {
    return (
      <div>
        <span>{address?.slice(0, 8)}…{address?.slice(-4)}</span>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return <button className="btn-primary" onClick={connect}>Connect Wallet</button>;
}
```

### Network switching

```tsx
const { network, setNetwork } = useWallet();

<select value={network} onChange={e => setNetwork(e.target.value as NetworkMode)}>
  <option value="mainnet">Mainnet</option>
  <option value="testnet">Testnet</option>
  <option value="devnet">Devnet</option>
</select>
```

---

## Vite Environment Integration

The network is configured at build time via Vite's `define`:

```ts
// vite.config.ts
define: {
  __STACKS_NETWORK__: JSON.stringify(process.env.STACKS_NETWORK ?? "testnet"),
}
```

Set `STACKS_NETWORK=mainnet` in `.env.production` for mainnet deployments.

---

## Dependencies

| Package | Role |
|---------|------|
| `@stacks/connect` | Wallet authentication modal |
| `@stacks/network` | `StacksMainnet`, `StacksTestnet` network objects |
| React 18 | Context, state |

---

## Security Notes

- Never store private keys or mnemonics in context state.
- Wallet sessions use `@stacks/connect` secure session storage — do not manually copy or log the session object.
- When switching networks at runtime, all in-flight contract calls should be cancelled or re-initiated.
