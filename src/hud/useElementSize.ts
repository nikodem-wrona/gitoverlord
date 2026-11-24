import { type RefObject, useLayoutEffect, useRef, useState } from "react";

export interface ElementSize {
  width: number;
  height: number;
}

const UNMEASURED: ElementSize = { width: 0, height: 0 };

/**
 * Gives the size of an element in pixels, and follows each change of the size.
 *
 * The size is zero before the browser gives it, and where there is no layout.
 */
export function useElementSize<Target extends HTMLElement>(): [
  RefObject<Target | null>,
  ElementSize,
] {
  const ref = useRef<Target>(null);
  const [size, setSize] = useState(UNMEASURED);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = element;
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
