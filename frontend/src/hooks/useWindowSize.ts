import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// useWindowSize — reactive browser window dimensions
// ---------------------------------------------------------------------------

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Returns the current browser window's `innerWidth` and `innerHeight`,
 * updating on every `resize` event.
 *
 * @example
 * const { width, height } = useWindowSize();
 * const isMobile = width < 640;
 */
export function useWindowSize(): WindowSize {
  const getSize = (): WindowSize => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const [size, setSize] = useState<WindowSize>(getSize);

  useEffect(() => {
    function handleResize() {
      setSize(getSize());
    }
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

export default useWindowSize;
