export type Orientation = "vertical" | "horizontal";

const STEP_KEYS: Record<Orientation, { next: string; previous: string }> = {
  vertical: { next: "ArrowDown", previous: "ArrowUp" },
  horizontal: { next: "ArrowRight", previous: "ArrowLeft" },
};

/**
 * Returns the item that a navigation key selects in a list of item keys.
 *
 * Returns `undefined` when `pressed` is not a navigation key. The selection stops at the ends.
 */
export function nextKey(
  keys: readonly string[],
  current: string | undefined,
  pressed: string,
  orientation: Orientation,
): string | undefined {
  if (keys.length === 0) return undefined;
  const last = keys.length - 1;
  const index = current === undefined ? -1 : keys.indexOf(current);
  const step = STEP_KEYS[orientation];

  switch (pressed) {
    case step.next:
      return keys[Math.min(index + 1, last)];
    case step.previous:
      return keys[Math.max(index - 1, 0)];
    case "Home":
      return keys[0];
    case "End":
      return keys[last];
    default:
      return undefined;
  }
}
