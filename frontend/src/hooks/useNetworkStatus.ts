import { useState, useEffect, useCallback } from "react";

interface NetworkConnection extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
}

interface NetworkStatus {
  /** Whether the browser has network connectivity */
  isOnline: boolean;
  /** Whether the browser is currently offline */
  isOffline: boolean;
  /** Effective connection type ("4g" | "3g" | "2g" | "slow-2g" | undefined) */
  effectiveType: string | undefined;
  /** Estimated downlink in Mbps (may be undefined) */
  downlink: number | undefined;
  /** Round-trip latency hint in ms (may be undefined) */
  rtt: number | undefined;
}

/**
 * useNetworkStatus
 *
 * Tracks the browser's network connectivity state. Updates automatically
 * when the connection goes online/offline or when the Network Information
 * API fires a change event.
 *
 * @example
 * const { isOnline, effectiveType } = useNetworkStatus();
 * if (!isOnline) return <Offline />;
 */
export function useNetworkStatus(): NetworkStatus {
  const getConnection = (): NetworkConnection | null => {
    const nav = navigator as NavigatorWithConnection;
    return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
  };

  const readState = useCallback((): NetworkStatus => {
    const online = typeof navigator !== "undefined" ? navigator.onLine : true;
    const conn = typeof navigator !== "undefined" ? getConnection() : null;
    return {
      isOnline: online,
      isOffline: !online,
      effectiveType: conn?.effectiveType,
      downlink: conn?.downlink,
      rtt: conn?.rtt,
    };
  }, []);

  const [status, setStatus] = useState<NetworkStatus>(readState);

  useEffect(() => {
    const update = () => setStatus(readState());

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    const conn = getConnection();
    conn?.addEventListener("change", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      conn?.removeEventListener("change", update);
    };
  }, [readState]);

  return status;
}
