# useContractCall

**Location:** `frontend/src/hooks/useContractCall.ts`

Wraps `@stacks/connect`'s `openContractCall` with loading, success, and error state management. Uses the installed Stacks wallet for signing.

---

## Return Value

```ts
{
  call: (options: ContractCallRegularOptions) => void;
  status: "idle" | "signing" | "broadcasting" | "success" | "error";
  txId: string | null;
  error: string | null;
  reset: () => void;
}
```

---

## Status Flow

```
idle → signing → success
            ↘ idle (user cancelled)
             → error
```

---

## Usage

```tsx
import { useContractCall } from "@/hooks/useContractCall";
import { uintCV } from "@stacks/transactions";
import { useNetwork } from "@/context/WalletContext";

function ContributeButton({ roundId }: { roundId: number }) {
  const network = useNetwork();
  const { call, status, txId } = useContractCall({
    onSuccess: (id) => console.log("Broadcast:", id),
  });

  const handleClick = () => {
    call({
      contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      contractName: "rosca",
      functionName: "contribute",
      functionArgs: [uintCV(roundId)],
      network,
      postConditions: [],
    });
  };

  return (
    <button onClick={handleClick} disabled={status === "signing"}>
      {status === "signing" ? "Waiting for wallet…" : "Contribute"}
    </button>
  );
}
```

---

## Options

| Option | Type | Description |
|--------|------|-------------|
| `onSuccess` | `(txId: string) => void` | Called after successful broadcast |
| `onError` | `(error: Error) => void` | Called on any failure |

---

## Notes

- Requires `@stacks/connect` to be installed and a Stacks wallet browser extension.
- `status` transitions to `"idle"` (not `"error"`) when the user cancels the wallet prompt.
- Call `reset()` to return to `"idle"` after a success or error so the button becomes interactive again.
