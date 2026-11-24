import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import { events, type SyncProgress } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";

import { useSyncPulse } from "./useSyncPulse";

const PATH = SAMPLE_SUMMARY.path;

/** Counts the renders of the drawing under the hook, like the timeline. */
const drawn = vi.fn<() => void>();

function Drawing({ operation }: { operation: string }) {
  drawn();
  return <p>pulse: {operation}</p>;
}

function Probe() {
  return <Drawing operation={useSyncPulse(PATH) ?? "none"} />;
}

const STEP: SyncProgress = {
  path: PATH,
  operation: "push",
  step: { phase: "Writing objects", percent: 10 },
};

/** Renders the probe and waits until it shows the operation of `STEP`. */
async function renderRunningPulse() {
  mockRepository();
  render(<Probe />);
  // The listener starts after the first render, so the event repeats until it arrives.
  await waitFor(async () => {
    await act(() => events.syncProgress.emit(STEP));
    expect(screen.getByText("pulse: push")).toBeInTheDocument();
  });
}

describe("useSyncPulse", () => {
  it("keeps the operation for a short time after its end", async () => {
    await renderRunningPulse();

    await act(() => events.syncProgress.emit({ ...STEP, step: null }));

    expect(screen.getByText("pulse: push")).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByText("pulse: none")).toBeInTheDocument(),
      {
        timeout: 2000,
      },
    );
  });

  it("does not render the drawing again for each step of the same operation", async () => {
    await renderRunningPulse();
    const before = drawn.mock.calls.length;

    for (const percent of [40, 70, 100]) {
      const next = { ...STEP, step: { phase: "Writing objects", percent } };
      await act(() => events.syncProgress.emit(next));
    }

    expect(drawn).toHaveBeenCalledTimes(before);
  });
});
