/** The rows to render, and the height of the space before and after them. */
export interface RowWindow {
  /** The index of the first rendered row. */
  start: number;
  /** The index after the last rendered row. */
  end: number;
  /** The height of the rows before `start`, in pixels. */
  before: number;
  /** The height of the rows after `end`, in pixels. */
  after: number;
}

/** The scroll state of a list with rows of one height. All values are in pixels. */
export interface RowView {
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
}

/** The rows above and below the viewport that stay rendered, so a scroll shows no gap. */
const OVERSCAN = 8;
/** The rows to render before the browser gives the sizes. */
const UNMEASURED_ROWS = 60;

/** Finds the rows that are in the viewport or near it. */
export function computeRowWindow(count: number, view: RowView): RowWindow {
  const { scrollTop, viewportHeight, rowHeight } = view;
  if (rowHeight <= 0 || viewportHeight <= 0) {
    return {
      start: 0,
      end: Math.min(count, UNMEASURED_ROWS),
      before: 0,
      after: 0,
    };
  }
  const first = Math.floor(scrollTop / rowHeight) - OVERSCAN;
  const last = Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN;
  const start = Math.min(Math.max(first, 0), count);
  const end = Math.min(Math.max(last, start), count);

  return {
    start,
    end,
    before: start * rowHeight,
    after: (count - end) * rowHeight,
  };
}

/**
 * Returns the scroll position that shows the row at `index`, or `undefined` if the row is in view.
 *
 * `headerHeight` is the height of a header that stays at the top of the viewport.
 */
export function scrollTopFor(
  index: number,
  view: RowView,
  headerHeight = 0,
): number | undefined {
  const top = index * view.rowHeight;
  const bottom = top + view.rowHeight + headerHeight;
  if (top < view.scrollTop) return top;
  if (bottom > view.scrollTop + view.viewportHeight) {
    return bottom - view.viewportHeight;
  }
  return undefined;
}
