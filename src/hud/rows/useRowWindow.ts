import {
  type RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  computeRowWindow,
  type RowView,
  type RowWindow,
  scrollTopFor,
} from "./rowWindow";

const UNMEASURED: RowView = { scrollTop: 0, viewportHeight: 0, rowHeight: 0 };

export interface RowWindowControl {
  /** Put this on the element that scrolls. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Put this on the same element. */
  onScroll(): void;
  window: RowWindow;
  /** Scrolls until the row at `index` is in view. */
  scrollToIndex(index: number): void;
}

/**
 * Renders only the rows that are in view, for a list with `count` rows of one height.
 *
 * Mark each rendered row with `data-row`. Put a spacer of `window.before` pixels before
 * the rows and a spacer of `window.after` pixels after them.
 */
export function useRowWindow(count: number): RowWindowControl {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(UNMEASURED);
  const hasRows = count > 0;

  const measure = useCallback(() => {
    const next = readView(scrollRef.current);
    setView((current) => (sameView(current, next) ? current : next));
  }, []);

  useLayoutEffect(() => {
    measure();
    const element = scrollRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  // The first row gives the row height. Measure again when the first row arrives.
  useLayoutEffect(() => {
    if (hasRows) measure();
  }, [hasRows, measure]);

  const scrollToIndex = useCallback((index: number) => {
    const element = scrollRef.current;
    if (!element) return;
    const header = element.querySelector("thead")?.offsetHeight ?? 0;
    const top = scrollTopFor(index, readView(element), header);
    if (top !== undefined) element.scrollTop = top;
  }, []);

  return {
    scrollRef,
    onScroll: measure,
    window: computeRowWindow(count, view),
    scrollToIndex,
  };
}

function readView(element: HTMLElement | null): RowView {
  if (!element) return UNMEASURED;
  const row = element.querySelector("[data-row]");
  const rowHeight = row?.getBoundingClientRect().height ?? 0;
  return {
    // The window changes only when the scroll passes a full row.
    scrollTop: rowHeight > 0 ? snap(element.scrollTop, rowHeight) : 0,
    viewportHeight: element.clientHeight,
    rowHeight,
  };
}

function snap(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

function sameView(a: RowView, b: RowView): boolean {
  return (
    a.scrollTop === b.scrollTop &&
    a.viewportHeight === b.viewportHeight &&
    a.rowHeight === b.rowHeight
  );
}
