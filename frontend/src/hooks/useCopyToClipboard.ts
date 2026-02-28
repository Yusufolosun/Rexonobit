// frontend/src/hooks/useCopyToClipboard.ts
// Clipboard write hook — provides one-shot copy action with transient "copied" state

import { useState, useCallback } from "react";

interface CopyResult {
  /** True immediately after a successful copy, clears after `resetMs`. */
  copied: boolean;
  /** Error message if the copy failed (e.g. permissions denied). */
  copyError: string | null;
  /** Call with the text to copy to the clipboard. */
  copyToClipboard: (text: string) => Promise<void>;
}

/**
 * Provides a `copyToClipboard` action and transient `copied` state.
 *
 * Uses the Clipboard API (`navigator.clipboard.writeText`).  Falls back to
 * `document.execCommand("copy")` on browsers that restrict clipboard access.
 *
 * @param resetMs  How long `copied` stays `true` (default 2000 ms)
 *
 * @example
 * const { copied, copyToClipboard } = useCopyToClipboard();
 * <button onClick={() => copyToClipboard(address)}>
 *   {copied ? "Copied!" : "Copy address"}
 * </button>
 */
export function useCopyToClipboard(resetMs = 2000): CopyResult {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const copyToClipboard = useCallback(
    async (text: string) => {
      setCopyError(null);
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Legacy fallback
          const el = document.createElement("textarea");
          el.value = text;
          el.style.position = "fixed";
          el.style.opacity = "0";
          document.body.appendChild(el);
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), resetMs);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Copy failed";
        setCopyError(msg);
      }
    },
    [resetMs]
  );

  return { copied, copyError, copyToClipboard };
}
