import { useMemo, useState } from "react";

/** The commits that the timeline shows, and their place in the loaded history. */
export interface TimelineWindow<Item> {
  visible: readonly Item[];
  /** The hashes of the visible commits that have a newer commit out of view. */
  continued: ReadonlySet<string>;
}

/**
 * Finds the first commit of the timeline.
 *
 * The timeline stays where it is while the selected commit is in it. If not, the timeline
 * moves and puts the selected commit in the middle.
 */
export function windowStart(
  current: number,
  selected: number,
  count: number,
  size: number,
): number {
  const last = Math.max(count - size, 0);
  const inView = selected >= current && selected < current + size;
  if (selected < 0 || inView) return Math.min(current, last);
  const centered = selected - Math.floor(size / 2);
  return Math.min(Math.max(centered, 0), last);
}

/**
 * Returns the `size` commits that the timeline shows. The timeline follows the selected commit.
 *
 * `items` has the newest commit first.
 */
export function useTimelineWindow<
  Item extends { hash: string; parents: readonly string[] },
>(
  items: readonly Item[],
  selectedHash: string | undefined,
  size: number,
): TimelineWindow<Item> {
  const [start, setStart] = useState(0);
  const selected = items.findIndex((item) => item.hash === selectedHash);
  const next = windowStart(start, selected, items.length, size);
  // React permits a state update during the render when the state follows the props.
  if (next !== start) setStart(next);

  return useMemo(() => {
    const newer = items.slice(0, next);
    return {
      visible: items.slice(next, next + size),
      continued: new Set(newer.flatMap((item) => item.parents)),
    };
  }, [items, next, size]);
}
