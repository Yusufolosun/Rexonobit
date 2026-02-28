// frontend/src/lib/wallet.ts
// Wallet connection helpers using @stacks/connect

import {
  showConnect,
  UserSession,
  AppConfig,
  type AuthOptions,
} from "@stacks/connect";

const APP_NAME = import.meta.env.VITE_APP_NAME || "Rexonobit";
const APP_ICON = import.meta.env.VITE_APP_ICON_URL || "/icon.png";

const appConfig = new AppConfig(["store_write", "publish_data"]);

export const userSession = new UserSession({ appConfig });

export function connectWallet(onFinish?: () => void): void {
  const authOptions: AuthOptions = {
    appDetails: {
      name: APP_NAME,
      icon: APP_ICON,
    },
    userSession,
    onFinish: () => {
      onFinish?.();
    },
    onCancel: () => {
      console.info("Wallet connect cancelled by user");
    },
  };
  showConnect(authOptions);
}

export function disconnectWallet(): void {
  userSession.signUserOut("/");
}

export function isWalletConnected(): boolean {
  return userSession.isUserSignedIn();
}

export function getConnectedAddress(): string | null {
  if (!isWalletConnected()) return null;
  try {
    const userData = userSession.loadUserData();
    return (
      userData?.profile?.stxAddress?.testnet ||
      userData?.profile?.stxAddress?.mainnet ||
      null
    );
  } catch {
    return null;
  }
}

export function getUserData() {
  if (!isWalletConnected()) return null;
  try {
    return userSession.loadUserData();
  } catch {
    return null;
  }
}
