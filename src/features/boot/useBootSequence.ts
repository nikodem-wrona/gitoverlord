import { useEffect, useState } from "react";

/** The time between two boot lines, in milliseconds. */
export const STEP_MS = 220;
/** The time that the last line stays before the shell opens, in milliseconds. */
export const HOLD_MS = 600;

/**
 * Shows the boot lines one after another, then calls `onFinish`.
 *
 * Returns the number of lines to show. `onFinish` must keep the same identity.
 */
export function useBootSequence(
  stepCount: number,
  onFinish: () => void,
): number {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible < stepCount) {
      const timer = setTimeout(() => setVisible((count) => count + 1), STEP_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(onFinish, HOLD_MS);
    return () => clearTimeout(timer);
  }, [visible, stepCount, onFinish]);

  return visible;
}
