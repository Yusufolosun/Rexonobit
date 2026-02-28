import { useState, useCallback } from "react";
import {
  makeContractCall,
  broadcastTransaction,
  type ContractCallOptions,
  type StacksTransaction,
} from "@stacks/transactions";
import { openContractCall } from "@stacks/connect";
import type { ContractCallRegularOptions } from "@stacks/connect";

export type CallStatus = "idle" | "signing" | "broadcasting" | "success" | "error";

interface UseContractCallOptions {
  /** Called when the transaction is successfully broadcast */
  onSuccess?: (txId: string) => void;
  /** Called when the call fails at any stage */
  onError?: (error: Error) => void;
}

interface UseContractCallResult {
  /** Trigger the contract call via Stacks wallet (openContractCall) */
  call: (options: ContractCallRegularOptions) => void;
  /** Current state of the call */
  status: CallStatus;
  /** Transaction ID after successful broadcast */
  txId: string | null;
  /** Error message if status is "error" */
  error: string | null;
  /** Reset state back to idle */
  reset: () => void;
}

/**
 * useContractCall
 *
 * Wraps `@stacks/connect`'s `openContractCall` with loading / success / error
 * state management. Uses the installed Stacks wallet for signing.
 *
 * @example
 * const { call, status, txId, error } = useContractCall({
 *   onSuccess: (id) => toast.success(`Tx submitted: ${id}`),
 * });
 *
 * call({
 *   contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
 *   contractName: "rosca",
 *   functionName: "contribute",
 *   functionArgs: [uintCV(roundId)],
 *   network,
 *   onFinish: ({ txId }) => onSuccess(txId),
 *   onCancel: () => reset(),
 * });
 */
export function useContractCall(
  hookOptions: UseContractCallOptions = {}
): UseContractCallResult {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxId(null);
    setError(null);
  }, []);

  const call = useCallback(
    (options: ContractCallRegularOptions) => {
      setStatus("signing");
      setTxId(null);
      setError(null);

      openContractCall({
        ...options,
        onFinish: (data) => {
          setTxId(data.txId);
          setStatus("success");
          options.onFinish?.(data);
          hookOptions.onSuccess?.(data.txId);
        },
        onCancel: () => {
          setStatus("idle");
          options.onCancel?.();
        },
      });
    },
    [hookOptions]
  );

  return { call, status, txId, error, reset };
}
