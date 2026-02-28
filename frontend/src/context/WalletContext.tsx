// frontend/src/context/WalletContext.tsx
// Global wallet state using React Context

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  connectWallet,
  disconnectWallet,
  isWalletConnected,
  getConnectedAddress,
  userSession,
} from "../lib/wallet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NetworkMode = "mainnet" | "testnet" | "devnet";

interface WalletContextType {
  address: string | null;
  connected: boolean;
  network: NetworkMode;
  connect: () => void;
  disconnect: () => void;
  setNetwork: (mode: NetworkMode) => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connected: false,
  network: "testnet",
  connect: () => {},
  disconnect: () => {},
  setNetwork: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [network, setNetworkState] = useState<NetworkMode>(() => {
    // Resolve initial network from env define injected by Vite
    const envNet =
      typeof __STACKS_NETWORK__ !== "undefined"
        ? (String(__STACKS_NETWORK__) as NetworkMode)
        : "testnet";
    return envNet;
  });

  const refresh = useCallback(() => {
    const isConnected = isWalletConnected();
    setConnected(isConnected);
    setAddress(isConnected ? getConnectedAddress() : null);
  }, []);

  useEffect(() => {
    // Handle redirect from Hiro Wallet after auth
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then(() => refresh());
    } else {
      // Use a microtask to avoid synchronous setState in the effect body
      queueMicrotask(refresh);
    }
  }, [refresh]);

  const connect = useCallback(() => {
    connectWallet(refresh);
  }, [refresh]);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setConnected(false);
    setAddress(null);
  }, []);

  const setNetwork = useCallback((mode: NetworkMode) => {
    setNetworkState(mode);
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, connected, network, connect, disconnect, setNetwork }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWallet(): WalletContextType {
  return useContext(WalletContext);
}

// Ambient declaration for Vite define constant
declare const __STACKS_NETWORK__: string | undefined;
