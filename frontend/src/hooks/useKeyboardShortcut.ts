import { useEffect, useRef } from "react";

type ModifierKeys = {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

interface KeyboardShortcutOptions extends ModifierKeys {
  /** When true the shortcut fires on keydown; when false on keyup. Default: true */
  keydown?: boolean;
  /** When true, prevent the browser's default action. Default: true */
  preventDefault?: boolean;
  /** When true, stop event propagation. Default: false */
  stopPropagation?: boolean;
  /** When true the listener is disabled. Default: false */
  disabled?: boolean;
}

/**
 * useKeyboardShortcut
 *
 * Registers a global keyboard shortcut. The callback fires when the specified
 * key (and optional modifier keys) match. Handles cleanup automatically.
 *
 * @param key    - The KeyboardEvent.key value, e.g. "Enter", "Escape", "k"
 * @param callback - Function to run when the shortcut fires
 * @param options  - Modifier keys and behaviour flags
 *
 * @example
 * // Ctrl+K to open search
 * useKeyboardShortcut("k", openSearch, { ctrl: true });
 *
 * // Escape to close modal
 * useKeyboardShortcut("Escape", closeModal);
 *
 * // Shift+? to open help
 * useKeyboardShortcut("?", openHelp, { shift: true });
 */
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
): void {
  const {
    ctrl = false,
    shift = false,
    alt = false,
    meta = false,
    keydown = true,
    preventDefault = true,
    stopPropagation = false,
    disabled = false,
  } = options;

  // Keep a stable ref to the callback so we avoid re-registering on every render
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; });

  useEffect(() => {
    if (disabled) return;

    const eventType = keydown ? "keydown" : "keyup";

    const handler = (event: KeyboardEvent) => {
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      const ctrlOk = ctrl ? event.ctrlKey : true;
      const shiftOk = shift ? event.shiftKey : true;
      const altOk = alt ? event.altKey : true;
      const metaOk = meta ? event.metaKey : true;

      // When modifier is required, also ensure no extra modifiers are pressed
      const noExtraCtrl = !ctrl ? !event.ctrlKey : true;
      const noExtraShift = !shift ? !event.shiftKey : true;
      const noExtraAlt = !alt ? !event.altKey : true;
      const noExtraMeta = !meta ? !event.metaKey : true;

      if (
        keyMatches &&
        ctrlOk &&
        shiftOk &&
        altOk &&
        metaOk &&
        noExtraCtrl &&
        noExtraShift &&
        noExtraAlt &&
        noExtraMeta
      ) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        callbackRef.current(event);
      }
    };

    document.addEventListener(eventType, handler);
    return () => document.removeEventListener(eventType, handler);
  }, [key, ctrl, shift, alt, meta, keydown, preventDefault, stopPropagation, disabled]);
}
