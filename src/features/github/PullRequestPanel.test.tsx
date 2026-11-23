import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import type { MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";

import { PullRequestPanel } from "./PullRequestPanel";
import { ACCOUNT, renderWithGitHub } from "./testing";

const PATH = SAMPLE_SUMMARY.path;

function renderPanel() {
  renderWithGitHub(<PullRequestPanel title="Pull requests" repoPath={PATH} />);
}

describe("PullRequestPanel", () => {
  it("lists the pull requests with their checks, and opens one on GitHub", async () => {
    const openGithubPage = vi.fn<MockCommandHandlers["openGithubPage"]>(
      () => null,
    );
    mockRepository({ githubAccount: () => ACCOUNT, openGithubPage });
    renderPanel();

    const grid = await screen.findByRole("grid", { name: "Pull requests" });
    const failing = within(grid).getByText("39").closest("tr");
    expect(failing).toHaveTextContent("Failing");
    expect(within(grid).getByText(/sweep the radar · Draft/)).toBeVisible();

    fireEvent.click(within(grid).getByText("feat: add the HUD kit"));
    fireEvent.click(screen.getByRole("button", { name: "Open #42 on GitHub" }));

    await waitFor(() =>
      expect(openGithubPage).toHaveBeenCalledWith({
        url: "https://github.com/gitoverlord/gitoverlord/pull/42",
      }),
    );
  });

  it("creates a pull request from the current branch", async () => {
    mockRepository({ githubAccount: () => ACCOUNT });
    renderPanel();

    const create = await screen.findByRole("button", {
      name: "Create a pull request…",
    });
    await waitFor(() => expect(create).toBeEnabled());
    fireEvent.click(create);
    const field = screen.getByRole("textbox", { name: "Title" });
    fireEvent.change(field, { target: { value: "feat: tune the HUD" } });
    fireEvent.submit(field);

    const grid = screen.getByRole("grid", { name: "Pull requests" });
    expect(await within(grid).findByText("feat: tune the HUD")).toBeVisible();
    expect(screen.getAllByText("Pull request #43 opened")).not.toHaveLength(0);
  });

  it("asks for a sign-in when the user is not signed in", async () => {
    mockRepository();
    renderPanel();

    expect(await screen.findByText("Not signed in")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Sign in to GitHub" }));
    expect(
      screen.getByRole("dialog", { name: "Sign in to GitHub" }),
    ).toBeVisible();
  });

  it("tells the user when the repository has no GitHub remote", async () => {
    mockRepository({
      githubAccount: () => ACCOUNT,
      githubPullRequests: () => null,
    });
    renderPanel();

    expect(await screen.findByText("No GitHub remote")).toBeVisible();
  });
});
