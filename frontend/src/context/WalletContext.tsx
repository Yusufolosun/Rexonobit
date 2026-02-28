// frontend/src/context/WalletContext.tsx
// Global wallet state using React Context

import React, {
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

interface WalletContextType {
  address: string | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connected: false,
  connect: () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

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
      refresh();
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

  return (
    <WalletContext.Provider value={{ address, connected, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  return useContext(WalletContext);
}
