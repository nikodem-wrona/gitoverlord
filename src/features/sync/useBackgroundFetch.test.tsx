import { act, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import type { MockCommandHandlers } from "@/ipc";
import { rejectWith } from "@/test/commandResults";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { SyncPanel } from "./SyncPanel";
import { FETCH_INTERVAL } from "./useBackgroundFetch";

const PATH = SAMPLE_SUMMARY.path;

function mockFetch() {
  return vi.fn<MockCommandHandlers["fetchRemotes"]>(() => null);
}

describe("useBackgroundFetch", () => {
  it("fetches when there was no fetch, and shows a failure only in the panel", async () => {
    const fetchRemotes = vi.fn<MockCommandHandlers["fetchRemotes"]>(
      rejectWith({ kind: "authFailed", message: "Permission denied." }),
    );
    mockRepository({
      repoSummary: () => ({ ...SAMPLE_SUMMARY, fetched: null }),
      fetchRemotes,
    });
    renderWithProviders(<SyncPanel repoPath={PATH} />);

    const status = await screen.findByText("Background fetch failed");
    expect(status).toHaveAttribute(
      "title",
      expect.stringMatching(/Permission denied/),
    );
    expect(fetchRemotes).toHaveBeenCalledOnce();
    const notifications = screen.getByRole("region", { name: "Notifications" });
    expect(within(notifications).queryByText(/failed/i)).toBeNull();
  });

  it("waits for the interval after a recent fetch", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    const fetchRemotes = mockFetch();
    mockRepository({ fetchRemotes });
    renderWithProviders(<SyncPanel repoPath={PATH} />);
    await screen.findByText(/^Fetched /);

    expect(fetchRemotes).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(FETCH_INTERVAL));

    await waitFor(() => expect(fetchRemotes).toHaveBeenCalledOnce());
  });

  it("does not fetch a repository without remotes", async () => {
    const fetchRemotes = mockFetch();
    mockRepository({
      repoSummary: () => ({ ...SAMPLE_SUMMARY, remotes: [], fetched: null }),
      fetchRemotes,
    });
    renderWithProviders(<SyncPanel repoPath={PATH} />);

    expect(await screen.findByText("Not fetched")).toBeVisible();
    expect(fetchRemotes).not.toHaveBeenCalled();
  });
});
