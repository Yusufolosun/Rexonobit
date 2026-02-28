import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// useQueue — FIFO queue state
// ---------------------------------------------------------------------------

interface UseQueueResult<T> {
  queue: T[];
  enqueue: (item: T) => void;
  dequeue: () => T | undefined;
  peek: () => T | undefined;
  clear: () => void;
  size: number;
  isEmpty: boolean;
}

/**
 * Manages a FIFO queue as React state.
 * `enqueue` adds to the back; `dequeue` removes from the front.
 *
 * @param initialItems  Optional initial queue contents
 *
 * @example
 * const { queue, enqueue, dequeue, peek } = useQueue<string>();
 * enqueue("first");
 * enqueue("second");
 * dequeue(); // returns "first"
 * peek();    // "second" (still in queue)
 */
export function useQueue<T>(initialItems?: T[]): UseQueueResult<T> {
  const [queue, setQueue] = useState<T[]>(initialItems ?? []);

  const enqueue = useCallback((item: T) => {
    setQueue((prev) => [...prev, item]);
  }, []);

  const dequeue = useCallback((): T | undefined => {
    let removed: T | undefined;
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      [removed] = prev;
      return prev.slice(1);
    });
    return removed;
  }, []);

  const peek = useCallback((): T | undefined => queue[0], [queue]);

  const clear = useCallback(() => setQueue([]), []);

  return {
    queue,
    enqueue,
    dequeue,
    peek,
    clear,
    size: queue.length,
    isEmpty: queue.length === 0,
  };
}

export default useQueue;
