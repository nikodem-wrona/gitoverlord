import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";

import { CloneFromGitHubButton } from "./CloneFromGitHubButton";
import { ACCOUNT, renderWithGitHub } from "./testing";

describe("CloneDialog", () => {
  it("filters the repositories and clones the selected one", async () => {
    const cloneRepository = vi.fn<MockCommandHandlers["cloneRepository"]>(
      () => "/work/star-charts",
    );
    mockRepository({
      githubAccount: () => ACCOUNT,
      pickFolder: () => "/work",
      cloneRepository,
    });
    const onCloned = renderWithGitHub(<CloneFromGitHubButton />);

    fireEvent.click(screen.getByRole("button", { name: "Clone from GitHub" }));
    const dialog = screen.getByRole("dialog", { name: "Clone from GitHub" });
    const grid = await within(dialog).findByRole("grid", {
      name: "GitHub repositories",
    });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Filter" }), {
      target: { value: "STAR" },
    });
    expect(within(grid).queryByText("overlord/dotfiles")).toBeNull();
    fireEvent.click(within(grid).getByText("overlord/star-charts"));

    await waitFor(() =>
      expect(onCloned).toHaveBeenCalledWith("/work/star-charts"),
    );
    expect(cloneRepository).toHaveBeenCalledWith({
      url: "https://github.com/overlord/star-charts.git",
      parent: "/work",
    });
  });

  it("asks for a sign-in first", async () => {
    mockRepository();
    renderWithGitHub(<CloneFromGitHubButton />);

    fireEvent.click(screen.getByRole("button", { name: "Clone from GitHub" }));

    expect(await screen.findByText("Not signed in")).toBeVisible();
  });
});
