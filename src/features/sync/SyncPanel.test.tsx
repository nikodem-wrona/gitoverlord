import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import { events, type SyncProgress } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { SyncPanel } from "./SyncPanel";

const PATH = SAMPLE_SUMMARY.path;

describe("SyncPanel", () => {
  it("shows the progress of a running operation", async () => {
    mockRepository();
    renderWithProviders(<SyncPanel repoPath={PATH} />);
    const step: SyncProgress = {
      path: PATH,
      operation: "push",
      step: { phase: "Writing objects", percent: 60 },
    };

    // The listener starts after the first render, so the event repeats until it arrives.
    const meter = await waitFor(async () => {
      await act(() => events.syncProgress.emit(step));
      return screen.getByRole("meter", { name: "Push" });
    });
    expect(meter).toHaveAttribute("aria-valuenow", "60");
    expect(screen.getByText("Writing objects")).toBeVisible();

    await act(() => events.syncProgress.emit({ ...step, step: null }));
    expect(screen.queryByRole("meter", { name: "Push" })).toBeNull();
    expect(screen.getByText(/^Fetched /)).toBeVisible();
  });
});
