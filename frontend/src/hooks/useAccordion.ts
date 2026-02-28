import { useCallback, useState } from "react";

interface UseAccordionOptions {
  /** Allow multiple panels to be open at once. Defaults to `false`. */
  multi?: boolean;
  /** Initially open panel index or indices. */
  defaultOpen?: number | number[];
}

interface UseAccordionReturn {
  /** Currently open panel indices. */
  openPanels: Set<number>;
  /** Whether a specific panel is open. */
  isOpen: (index: number) => boolean;
  /** Toggle a panel open/closed. */
  toggle: (index: number) => void;
  /** Open a specific panel. */
  open: (index: number) => void;
  /** Close a specific panel. */
  close: (index: number) => void;
  /** Close all panels. */
  closeAll: () => void;
}

/**
 * useAccordion
 *
 * Manages open/closed state for an accordion or collapsible panel group.
 * Supports single-open (default) and multi-open modes.
 *
 * @example
 * const { isOpen, toggle } = useAccordion({ defaultOpen: 0 });
 */
export function useAccordion(options: UseAccordionOptions = {}): UseAccordionReturn {
  const { multi = false, defaultOpen } = options;

  const initialSet = (): Set<number> => {
    if (defaultOpen === undefined) return new Set();
    if (Array.isArray(defaultOpen)) return new Set(defaultOpen);
    return new Set([defaultOpen]);
  };

  const [openPanels, setOpenPanels] = useState<Set<number>>(initialSet);

  const isOpen = useCallback(
    (index: number) => openPanels.has(index),
    [openPanels]
  );

  const toggle = useCallback(
    (index: number) => {
      setOpenPanels((prev) => {
        const next = new Set(multi ? prev : new Set<number>());
        if (prev.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    },
    [multi]
  );

  const open = useCallback(
    (index: number) => {
      setOpenPanels((prev) => {
        const next = new Set(multi ? prev : new Set<number>());
        next.add(index);
        return next;
      });
    },
    [multi]
  );

  const close = useCallback((index: number) => {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const closeAll = useCallback(() => setOpenPanels(new Set()), []);

  return { openPanels, isOpen, toggle, open, close, closeAll };
}
