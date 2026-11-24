import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import type { Branch, MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { SyncButtons } from "./SyncButtons";

const PATH = SAMPLE_SUMMARY.path;

function branch(extra: Partial<Branch>): Branch {
  return {
    name: "main",
    current: true,
    upstream: "origin/main",
    ahead: 0,
    behind: 0,
    tip: "abc1234",
    updated: 0,
    ...extra,
  };
}

/** Finds a button. The buttons wait for the branches before they enable. */
async function enabledButton(name: string) {
  const button = await screen.findByRole("button", { name });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
}

describe("SyncButtons", () => {
  it("shows the counts and pushes the new commits", async () => {
    const pushBranch = vi.fn<MockCommandHandlers["pushBranch"]>(() => null);
    mockRepository({ pushBranch });
    renderWithProviders(<SyncButtons repoPath={PATH} />);

    const push = await enabledButton("Push to the upstream");
    expect(push).toHaveTextContent("Push ↑3");
    expect(screen.getByRole("button", { name: /^Pull/ })).toHaveTextContent(
      "Pull ↓1",
    );
    fireEvent.click(push);

    expect(await screen.findByText("Push complete")).toBeInTheDocument();
    expect(pushBranch).toHaveBeenCalledWith({ path: PATH });
  });

  it("publishes a branch that has no upstream", async () => {
    const publishBranch = vi.fn<MockCommandHandlers["publishBranch"]>(
      () => "origin/main",
    );
    mockRepository({
      repoBranches: () => [branch({ upstream: null })],
      publishBranch,
    });
    renderWithProviders(<SyncButtons repoPath={PATH} />);

    fireEvent.click(await enabledButton("Publish the branch"));

    expect(await screen.findByText("main follows origin/main.")).toBeVisible();
    expect(publishBranch).toHaveBeenCalledOnce();
  });

  it("tells why a command cannot run", async () => {
    mockRepository({
      repoSummary: () => ({ ...SAMPLE_SUMMARY, remotes: [] }),
      repoBranches: () => [branch({})],
    });
    renderWithProviders(<SyncButtons repoPath={PATH} />);

    const push = screen.getByRole("button", { name: "Push to the upstream" });
    await waitFor(() =>
      expect(push).toHaveAttribute("title", "There are no commits to push."),
    );
    const fetch = screen.getByRole("button", { name: "Fetch the remotes" });
    expect(fetch).toBeDisabled();
    expect(fetch).toHaveAttribute("title", expect.stringMatching(/no remote/));
  });
});
