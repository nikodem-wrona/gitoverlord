import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import { events, type MockCommandHandlers, type SyncProgress } from "@/ipc";
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

  it("force pushes a diverged branch after a confirmation, and Undo puts the old commit back", async () => {
    const forcePushBranch = vi.fn<MockCommandHandlers["forcePushBranch"]>(
      () => "0ld71p",
    );
    const undoForcePush = vi.fn<MockCommandHandlers["undoForcePush"]>(
      () => null,
    );
    mockRepository({ forcePushBranch, undoForcePush });
    renderWithProviders(<SyncPanel repoPath={PATH} />);

    // The sample branch is 3 commits ahead of its upstream and 1 behind.
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Force push to the upstream…",
      }),
    );
    const dialog = screen.getByRole("dialog", { name: "Force push" });
    expect(dialog).toHaveTextContent("the remote loses 1 commit");
    fireEvent.click(within(dialog).getByRole("button", { name: "Force push" }));

    expect(await screen.findByText("Force push complete")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() =>
      expect(undoForcePush).toHaveBeenCalledWith(
        expect.objectContaining({ previous: "0ld71p" }),
      ),
    );
  });
});
