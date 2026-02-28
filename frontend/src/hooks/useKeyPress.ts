import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// useKeyPress — detect whether a specific keyboard key is currently pressed
// ---------------------------------------------------------------------------

/**
 * Returns `true` while the given key is held down.
 * Also supports a callback-only mode when you don't need the boolean state.
 *
 * @param targetKey  The `KeyboardEvent.key` value to watch (e.g. `"Escape"`, `"Enter"`)
 * @param onKeyDown  Optional callback invoked on keydown
 * @param onKeyUp    Optional callback invoked on keyup
 *
 * @example
 * const escPressed = useKeyPress("Escape");
 * useKeyPress("Enter", () => submitForm());
 */
export function useKeyPress(
  targetKey: string,
  onKeyDown?: () => void,
  onKeyUp?: () => void
): boolean {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    function handleDown(event: KeyboardEvent) {
      if (event.key !== targetKey) return;
      setPressed(true);
      onKeyDown?.();
    }
    function handleUp(event: KeyboardEvent) {
      if (event.key !== targetKey) return;
      setPressed(false);
      onKeyUp?.();
    }
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, [targetKey, onKeyDown, onKeyUp]);

  return pressed;
}

export default useKeyPress;
