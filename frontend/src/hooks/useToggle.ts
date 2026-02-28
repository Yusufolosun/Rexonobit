// frontend/src/hooks/useToggle.ts
// Boolean toggle hook — simplifies open/close and show/hide state

import { useState, useCallback } from "react";

/**
 * Manages a boolean state with convenient `toggle`, `setTrue`, and `setFalse` helpers.
 *
 * @param initialValue  Starting value (default `false`)
 * @returns `[value, toggle, setTrue, setFalse]`
 *
 * @example
 * const [isOpen, toggleOpen, openModal, closeModal] = useToggle();
 * <button onClick={openModal}>Open</button>
 * {isOpen && <Modal onClose={closeModal} />}
 */
export function useToggle(
  initialValue = false
): [boolean, () => void, () => void, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse];
}
