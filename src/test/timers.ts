import { act } from "@testing-library/react";
import { vi } from "vitest";

/**
 * Moves fake timers forward in steps, so React renders and schedules the next timer
 * after each step. Call `vi.useFakeTimers()` first.
 */
export function advanceInSteps(stepMs: number, steps: number): void {
  for (let step = 0; step < steps; step += 1) {
    act(() => {
      vi.advanceTimersByTime(stepMs);
    });
  }
}
