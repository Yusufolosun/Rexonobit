# useCountdown

Provides a countdown timer that counts down from a given number of seconds. Exposes `start`, `pause`, and `reset` controls.

## Import

```ts
import { useCountdown } from "@/hooks/useCountdown";
```

## Signature

```ts
function useCountdown(initialSeconds: number): {
  count: number;
  isRunning: boolean;
  isDone: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}
```

## Parameters

| Parameter        | Type     | Description                                    |
| ---------------- | -------- | ---------------------------------------------- |
| `initialSeconds` | `number` | Starting value; countdown stops at `0`         |

## Return Value

| Property    | Type         | Description                                   |
| ----------- | ------------ | --------------------------------------------- |
| `count`     | `number`     | Current remaining seconds                     |
| `isRunning` | `boolean`    | `true` while the timer is ticking             |
| `isDone`    | `boolean`    | `true` when `count` has reached `0`           |
| `start`     | `() => void` | Begins or resumes the countdown               |
| `pause`     | `() => void` | Pauses without resetting                      |
| `reset`     | `() => void` | Stops and restores `count` to `initialSeconds`|

## Example

```tsx
import { useCountdown } from "@/hooks/useCountdown";

function PayoutTimer() {
  const { count, isRunning, isDone, start, reset } = useCountdown(3600);
  return (
    <div>
      <p>Time remaining: {count}s</p>
      {!isRunning && !isDone && <button onClick={start}>Start</button>}
      {isDone && <button onClick={reset}>Reset</button>}
    </div>
  );
}
```

## Notes

- Uses `setInterval` internally; the interval is cleared on component unmount.
- `start()` is a no-op when `isDone` is `true`; call `reset()` first.
